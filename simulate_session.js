require('dotenv').config({ override: true });
const { PrismaClient, UserType, SessionStatus, SubSessionStatus, PlayerStatus, ActionType } = require('@prisma/client');

const prisma = new PrismaClient();

async function runSimulation() {
  console.log('--- STARTING SESSION SIMULATION ---');

  // 1. DATA GATHERING
  const session = await prisma.session.findFirst({
    where: { status: 'PENDING' },
    include: { rules: true }
  });

  if (!session) {
    console.error('No pending session found. Please run seed first.');
    return;
  }

  const testUser = await prisma.user.findUnique({ where: { username: 'TestPlayer' } });
  const bots = await prisma.user.findMany({ where: { type: 'BOT' }, take: 99 });
  const allPlayers = [testUser, ...bots];

  console.log(`Simulating with: 1 Real User (${testUser.username}) and ${bots.length} Bots.`);

  // 2. SUB-SESSION DISTRIBUTION ENGINE
  console.log('\n--- 1. SUB-SESSION DISTRIBUTION ---');
  // Group by squad (simplified for simulation: everyone is solo except if we manually added squads)
  // Let's create a temporary squad for 5 bots to test squad logic
  const squad = await prisma.squad.upsert({
    where: { name: 'BotSquad_Alpha' },
    update: {},
    create: { name: 'BotSquad_Alpha', leaderId: bots[0].id }
  });
  
  // Assign 5 bots to this squad
  for(let i=0; i<5; i++) {
      await prisma.user.update({ where: { id: bots[i].id }, data: { squadId: squad.id } });
  }

  // Distribution logic
  const playersWithSquads = await prisma.user.findMany({
    where: { id: { in: allPlayers.map(p => p.id) } },
    include: { squad: true }
  });

  const subSessions = [];
  const capacity = 100;
  let currentSSPlayers = [];
  let currentCount = 0;

  // Group players by squadId
  const groups = {};
  playersWithSquads.forEach(p => {
    const key = p.squadId || `solo-${p.id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  for (const key in groups) {
    const group = groups[key];
    if (currentCount + group.length > capacity && currentCount > 0) {
      // Sub-session full, move to next
      subSessions.push([...currentSSPlayers]);
      currentSSPlayers = [];
      currentCount = 0;
    }
    currentSSPlayers.push(...group);
    currentCount += group.length;
  }
  if (currentSSPlayers.length > 0) subSessions.push(currentSSPlayers);

  console.log(`Distributed ${playersWithSquads.length} players into ${subSessions.length} sub-session(s).`);
  subSessions.forEach((ss, i) => {
    console.log(`Sub-session ${i + 1}: ${ss.length} players.`);
  });

  // 3. GAME LOOP SIMULATION
  console.log('\n--- 2. GAME LOOP & AI BEHAVIOR ---');
  const gameState = subSessions[0].map(p => ({
    id: p.id,
    username: p.username,
    isBot: p.type === 'BOT',
    tokens: Number(p.balance),
    progress: 0,
    status: 'ALIVE',
    behavior: p.type === 'BOT' ? ['aggressive', 'defensive', 'balanced'][Math.floor(Math.random() * 3)] : 'player',
    hasShield: false,
    hasInsurance: false,
    rivals: [] // Track who stole from them
  }));

  const phases = [
    { name: 'Phase 1', spins: 10, eliminatePercent: 20 },
    { name: 'Phase 2', spins: 10, eliminatePercent: 30 },
    { name: 'Phase 3', spins: 10, eliminatePercent: 40 },
    { name: 'Phase 4 (Finals)', spins: 3, eliminatePercent: 0 } // Top 2
  ];

  const eliminationTimeline = [];
  let totalSteals = 0;
  const stealCounts = {}; // Track who steals most
  const targetCounts = {}; // Track who is targeted most

  for (let pIdx = 0; pIdx < phases.length; pIdx++) {
    const phase = phases[pIdx];
    console.log(`\n>> ${phase.name} (${phase.spins} spins)`);

    // Top 2 Showdown Check
    if (pIdx === phases.length - 1) {
        const remaining = gameState.filter(g => g.status === 'ALIVE').sort((a,b) => b.progress - a.progress);
        if (remaining.length > 2) {
            console.log(`Eliminating all but top 2 for showdown...`);
            remaining.slice(2).forEach(p => {
                p.status = 'ELIMINATED';
                eliminationTimeline.push({ phase: phase.name, user: p.username });
            });
        }
    }

    for (let s = 1; s <= phase.spins; s++) {
      gameState.filter(g => g.status === 'ALIVE').forEach(player => {
        // SPIN EVENT
        const rand = Math.random();
        let outcome = '';

        if (rand < 0.4) {
          player.progress += 2;
          outcome = '+advance (2 pts)';
        } else if (rand < 0.7) {
          player.tokens += 10; // Normalized token gain
          outcome = '+10 tokens';
        } else if (rand < 0.9) {
          // STEAL LOGIC
          const targets = gameState.filter(g => g.id !== player.id && g.status === 'ALIVE' && !g.hasShield);
          if (targets.length > 0) {
            // AI Target Selection
            let target;
            if (player.rivals.length > 0 && Math.random() < 0.7) {
              const rivalId = player.rivals[Math.floor(Math.random() * player.rivals.length)];
              target = targets.find(t => t.id === rivalId) || targets[Math.floor(Math.random() * targets.length)];
            } else {
              target = targets[Math.floor(Math.random() * targets.length)];
            }

            const stealAmount = Math.min(target.tokens, 50);
            target.tokens -= stealAmount;
            player.tokens += stealAmount;
            target.rivals.push(player.id);
            
            stealCounts[player.id] = (stealCounts[player.id] || 0) + 1;
            targetCounts[target.id] = (targetCounts[target.id] || 0) + 1;
            totalSteals++;
            outcome = `stole ${stealAmount} from ${target.username}`;
          } else {
            outcome = 'steal failed (all shielded/none available)';
          }
        } else {
          // Shield activation for bots based on strategy
          if (player.behavior === 'defensive' || Math.random() < 0.3) {
            player.hasShield = true;
            outcome = 'shield activated';
          } else {
            player.progress += 1;
            outcome = '+advance (1 pt)';
          }
        }
      });
    }

    // ELIMINATION AT END OF PHASE
    if (pIdx < phases.length - 1) {
      const alive = gameState.filter(g => g.status === 'ALIVE').sort((a, b) => a.progress - b.progress);
      const toEliminateCount = Math.floor(alive.length * (phase.eliminatePercent / 100));
      console.log(`Phase End: Eliminating bottom ${toEliminateCount} players.`);
      
      for (let i = 0; i < toEliminateCount; i++) {
        alive[i].status = 'ELIMINATED';
        eliminationTimeline.push({ phase: phase.name, user: alive[i].username });
      }
    }
  }

  // 4. OUTPUT SIMULATION REPORT
  console.log('\n--- 3. SIMULATION REPORT ---');
  const finalStandings = gameState.filter(g => g.status === 'ALIVE').sort((a, b) => b.progress - a.progress);
  const winner = finalStandings[0];

  console.log(`WINNER: ${winner.username} (Progress: ${winner.progress}, Tokens: ${winner.tokens})`);
  
  console.log('\nFINAL TOKEN LEADERBOARD (Top 10):');
  gameState.sort((a, b) => b.tokens - a.tokens).slice(0, 10).forEach((p, i) => {
    console.log(`${i+1}. ${p.username}: ${p.tokens} tokens [${p.status}]`);
  });

  console.log('\nELIMINATION TIMELINE (Last 5):');
  eliminationTimeline.slice(-5).forEach(e => console.log(`- ${e.user} in ${e.phase}`));

  const mostAggressiveId = Object.keys(stealCounts).reduce((a, b) => stealCounts[a] > stealCounts[b] ? a : b);
  const mostTargetedId = Object.keys(targetCounts).reduce((a, b) => targetCounts[a] > targetCounts[b] ? a : b);
  const mostAggressive = gameState.find(g => g.id === mostAggressiveId);
  const mostTargeted = gameState.find(g => g.id === mostTargetedId);

  console.log(`\nMOST AGGRESSIVE BOT: ${mostAggressive ? mostAggressive.username : 'N/A'} (${stealCounts[mostAggressiveId]} steals)`);
  console.log(`MOST TARGETED USER: ${mostTargeted ? mostTargeted.username : 'N/A'} (${targetCounts[mostTargetedId]} times)`);

  console.log('\n--- SIMULATION COMPLETE ---');
}

runSimulation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
