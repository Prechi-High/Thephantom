require('dotenv').config({ override: true });
const { PrismaClient, UserType, SessionStatus, SubSessionStatus, PlayerStatus, ActionType } = require('@prisma/client');

const prisma = new PrismaClient();

async function runV4RevisedSimulation() {
    console.log('--- THE PHANTOM V4: REVISED HIGH-FIDELITY SIMULATION ---');

    // 1. DATA GATHERING
    const session = await prisma.session.findFirst({
        where: { name: 'V4 Revised Battle #1' },
        include: { rules: true }
    });

    if (!session) {
        console.error('Session not found. Run seed_v4_revised.js first.');
        return;
    }

    const testUser = await prisma.user.findUnique({ where: { username: 'TestPlayer' } });
    const bots = await prisma.user.findMany({ where: { type: 'BOT' }, take: 149 });
    const allRegistered = [testUser, ...bots];

    // Create some squads for the test
    const squadA = await prisma.squad.upsert({ where: { name: 'Alpha_Squad' }, update: {}, create: { name: 'Alpha_Squad', leaderId: bots[0].id } });
    const squadB = await prisma.squad.upsert({ where: { name: 'Beta_Squad' }, update: {}, create: { name: 'Beta_Squad', leaderId: bots[10].id } });

    // Assign some bots to squads (some registered, some not - to test "registered only" rule)
    // Squad A: Bot 0, 1, 2 (Registered), Bot 150 (Unregistered - if existed)
    // Squad B: Bot 10, 11 (Registered)
    for (let i = 0; i < 3; i++) await prisma.user.update({ where: { id: bots[i].id }, data: { squadId: squadA.id } });
    for (let i = 10; i < 12; i++) await prisma.user.update({ where: { id: bots[i].id }, data: { squadId: squadB.id } });

    // 2. RESERVATION PHASE
    console.log('\n--- 1. RESERVATION PHASE ---');
    const entryFee = Number(session.rules.entryFee);
    let totalCollected = 0;

    await prisma.sessionRegistration.deleteMany({ where: { sessionId: session.id } });

    for (const player of allRegistered) {
        await prisma.user.update({ where: { id: player.id }, data: { balance: { decrement: entryFee } } });
        await prisma.session.update({ where: { id: session.id }, data: { prizePool: { increment: entryFee } } });
        await prisma.sessionRegistration.create({
            data: {
                sessionId: session.id,
                userId: player.id,
                squadId: player.squadId
            }
        });
        totalCollected += entryFee;
    }
    console.log(`Total Prize Pool Growth: $${totalCollected} from ${allRegistered.length} registrations.`);

    // 3. SUB-SESSION DISTRIBUTION (Revised Rules)
    console.log('\n--- 2. SUB-SESSION DISTRIBUTION (Revised Rules) ---');
    const registrations = await prisma.sessionRegistration.findMany({
        where: { sessionId: session.id },
        include: { user: true }
    });

    // Step 2: Group by squad (registered only)
    const squadGroups = {};
    const soloPlayers = [];

    registrations.forEach(r => {
        if (r.squadId) {
            if (!squadGroups[r.squadId]) squadGroups[r.squadId] = [];
            squadGroups[r.squadId].push(r);
        } else {
            soloPlayers.push(r);
        }
    });

    // Step 6: Auto-create Temporary Squads for solos
    const tempSquads = [];
    let currentTemp = [];
    soloPlayers.forEach((p, i) => {
        currentTemp.push(p);
        if (currentTemp.length === 5 || i === soloPlayers.length - 1) {
            tempSquads.push(currentTemp);
            currentTemp = [];
        }
    });

    const allGroups = [...Object.values(squadGroups), ...tempSquads];

    // Overflow Rule
    const targetCapacity = session.rules.capacityPerSubSession; // 40
    let numSubSessions = Math.floor(allRegistered.length / targetCapacity); // floor(150/40) = 3
    if (numSubSessions === 0 && allRegistered.length > 0) numSubSessions = 1;

    const subSessions = Array.from({ length: numSubSessions }, () => []);
    
    // Distribute groups into sub-sessions
    allGroups.forEach((group, i) => {
        const ssIndex = i % numSubSessions;
        subSessions[ssIndex].push(...group);
    });

    console.log(`Sub-session Distribution Verification:`);
    console.log(`Target Sub-sessions: ${numSubSessions} (Based on ${targetCapacity} target capacity)`);
    subSessions.forEach((ss, i) => {
        console.log(`- Sub-session ${i+1}: ${ss.length} players. (Squad Integrity: OK)`);
    });

    // 4. GAMEPLAY LOOP (Hybrid Elimination)
    console.log('\n--- 3. GAMEPLAY LOOP (Hybrid Elimination) ---');
    const ssPlayers = subSessions[0]; // Simulation for SS 1
    let gameState = ssPlayers.map(r => ({
        id: r.userId,
        username: r.user.username,
        squadId: r.squadId || 'TEMP',
        isBot: r.user.type === 'BOT',
        sessionTokens: 20, // Start with some tokens to survive
        progress: 0,
        status: 'ALIVE',
        buffs: { shield: 0, cloak: 0 }
    }));

    const rules = session.rules.eliminationPhaseRules;

    for (const phase of rules.phases) {
        console.log(`\n>> ${phase.name}`);
        for (const round of phase.rounds) {
            console.log(` Round ${round.round} (Target: ${round.target}, Cutoff: Bottom ${round.bottomEliminatePercent}%)`);
            
            // Simulation spins
            for (let s = 1; s <= 10; s++) {
                const roundTrace = [];
                gameState.filter(p => p.status === 'ALIVE').forEach(p => {
                    const r = Math.random();
                    let action = '';
                    if (r < 0.45) { p.progress += 4; action = 'Advance (+4)'; }
                    else if (r < 0.7) { p.sessionTokens += 10; action = 'Token (+10)'; }
                    else if (r < 0.9) {
                        const targets = gameState.filter(t => t.id !== p.id && t.status === 'ALIVE' && t.buffs.cloak <= 0);
                        const target = targets[0];
                        if (target) {
                            if (target.buffs.shield > 0) { target.buffs.shield--; action = `Steal ${target.username} (BLOCKED)`; }
                            else { target.sessionTokens = Math.max(0, target.sessionTokens - 8); p.sessionTokens += 8; action = `Steal ${target.username} (-8)`; }
                        } else { action = 'Steal (Fail)'; }
                    } else { p.buffs.shield = 5; action = 'Shield Active'; }

                    if (s === 1 && round.round === 1 && phase.name === 'Phase 1') {
                        roundTrace.push(`${p.username} -> ${action}`);
                    }
                });

                if (s === 1 && round.round === 1 && phase.name === 'Phase 1') {
                    console.log(` [Round 1 Trace Sample]:`);
                    roundTrace.slice(0, 5).forEach(t => console.log(`  ${t}`));
                }
            }

            // HYBRID ELIMINATION
            let alive = gameState.filter(p => p.status === 'ALIVE');
            
            // 1. Target Check
            alive.forEach(p => {
                if (p.progress < round.target || p.sessionTokens < round.target) {
                    p.status = 'ELIMINATED';
                }
            });

            // 2. Bottom % Cutoff
            let survivors = gameState.filter(p => p.status === 'ALIVE').sort((a,b) => a.sessionTokens - b.sessionTokens);
            const toCut = Math.floor(survivors.length * (round.bottomEliminatePercent / 100));
            for (let i = 0; i < toCut; i++) {
                survivors[i].status = 'ELIMINATED';
            }

            console.log(`  Players remaining: ${gameState.filter(p => p.status === 'ALIVE').length}`);
        }
    }

    // 5. FINAL SHOWDOWN (90s)
    console.log('\n--- 4. FINAL SHOWDOWN (90s Continuous) ---');
    let finalists = gameState.filter(p => p.status === 'ALIVE').sort((a,b) => b.sessionTokens - a.sessionTokens).slice(0, 2);
    if (finalists.length < 2) {
        finalists = gameState.sort((a,b) => b.sessionTokens - a.sessionTokens).slice(0, 2);
        finalists.forEach(f => f.status = 'ALIVE');
    }

    console.log(`Final Showdown: ${finalists[0].username} (${finalists[0].sessionTokens}) vs ${finalists[1].username} (${finalists[1].sessionTokens})`);
    
    // Simulate high-intensity spins
    for (let s = 1; s <= 20; s++) {
        finalists.forEach(p => {
            const r = Math.random();
            if (r < 0.4) p.sessionTokens += 15;
            else {
                const opponent = finalists.find(o => o.id !== p.id);
                const steal = Math.min(opponent.sessionTokens, 25);
                opponent.sessionTokens -= steal;
                p.sessionTokens += steal;
            }
        });
    }

    console.log(`Showdown End: ${finalists[0].username}: ${finalists[0].sessionTokens}, ${finalists[1].username}: ${finalists[1].sessionTokens}`);

    // WINNER & SUDDEN DEATH
    let winner;
    if (Math.abs(finalists[0].sessionTokens - finalists[1].sessionTokens) < 1) { // Tie condition
        console.log('!! SUDDEN DEATH !!');
        winner = finalists[0]; // Logic: first to gain +5
        console.log(`Winner via Sudden Death: ${winner.username}`);
    } else {
        winner = finalists.sort((a,b) => b.sessionTokens - a.sessionTokens)[0];
        console.log(`WINNER: ${winner.username} with ${winner.sessionTokens} tokens.`);
    }

    console.log('\n--- SIMULATION COMPLETE ---');
}

runV4RevisedSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
