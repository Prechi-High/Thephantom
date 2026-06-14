require('dotenv').config({ override: true });
const { PrismaClient, UserType, SessionStatus, SubSessionStatus, PlayerStatus, ActionType } = require('@prisma/client');

const prisma = new PrismaClient();

async function runV4FinalSimulation() {
    console.log('--- THE PHANTOM V4: FINAL HIGH-FIDELITY SIMULATION ---');

    // 1. DATA GATHERING
    const session = await prisma.session.findFirst({
        where: { name: 'V4 Championship #1' },
        include: { rules: true }
    });

    if (!session) {
        console.error('Session not found. Run seed_v4.js first.');
        return;
    }

    const testUser = await prisma.user.findUnique({ where: { username: 'TestPlayer' } });
    const bots = await prisma.user.findMany({ where: { type: 'BOT' }, take: 99 });
    const allPlayers = [testUser, ...bots];

    // 2. ENTRY FEE FLOW CORRECTION (Reservation Phase)
    console.log('\n--- 1. RESERVATION PHASE (Entry Fee Flow) ---');
    
    // Cleanup existing registrations for this session for simulation purposes
    await prisma.sessionRegistration.deleteMany({ where: { sessionId: session.id } });
    await prisma.session.update({ where: { id: session.id }, data: { prizePool: 0 } });

    const entryFee = Number(session.rules.entryFee);
    let totalCollected = 0;

    for (const player of allPlayers) {
        // In real app, this happens when user clicks "Reserve"
        // Deduct from balance
        await prisma.user.update({
            where: { id: player.id },
            data: { balance: { decrement: entryFee } }
        });

        // Add to session pool
        await prisma.session.update({
            where: { id: session.id },
            data: { prizePool: { increment: entryFee } }
        });

        // Create registration
        await prisma.sessionRegistration.create({
            data: {
                sessionId: session.id,
                userId: player.id,
                squadId: player.squadId
            }
        });

        totalCollected += entryFee;
        if (player.type === 'REAL') {
            console.log(`[Reservation] ${player.username} reserved seat. Fee: $${entryFee} deducted.`);
        }
    }
    console.log(`Total Prize Pool Growth: $${totalCollected}`);

    // 3. SESSION START & SUB-SESSION DISTRIBUTION (Squad-Aware)
    console.log('\n--- 2. SESSION START & SQUAD DISTRIBUTION ---');
    const registrations = await prisma.sessionRegistration.findMany({
        where: { sessionId: session.id },
        include: { user: true }
    });

    // Priority 1 & 2: Group by squad
    const squads = {};
    const solos = [];
    registrations.forEach(r => {
        if (r.squadId) {
            if (!squads[r.squadId]) squads[r.squadId] = [];
            squads[r.squadId].push(r);
        } else {
            solos.push(r);
        }
    });

    const subSessions = [];
    const capacity = session.rules.capacityPerSubSession;
    let currentSS = [];
    let currentCount = 0;

    // Fill with squads first
    for (const squadId in squads) {
        const squadMembers = squads[squadId];
        if (currentCount + squadMembers.length > capacity && currentCount > 0) {
            subSessions.push(currentSS);
            currentSS = [];
            currentCount = 0;
        }
        currentSS.push(...squadMembers);
        currentCount += squadMembers.length;
    }

    // Fill remaining with solos
    for (const solo of solos) {
        if (currentCount >= capacity) {
            subSessions.push(currentSS);
            currentSS = [];
            currentCount = 0;
        }
        currentSS.push(solo);
        currentCount++;
    }
    if (currentSS.length > 0) subSessions.push(currentSS);

    console.log(`Sub-session Distribution Verification:`);
    subSessions.forEach((ss, i) => {
        console.log(`- Sub-session ${i+1}: ${ss.length} players. (Squad integrity maintained)`);
    });

    // 4. GAMEPLAY LOOP (Phase Targets)
    console.log('\n--- 3. GAMEPLAY LOOP (Phase Targets) ---');
    const rules = session.rules.eliminationPhaseRules;
    
    let gameState = subSessions[0].map(r => ({
        id: r.userId,
        username: r.user.username,
        squadId: r.squadId,
        isBot: r.user.type === 'BOT',
        sessionTokens: 10, // Starting tokens
        progress: 0,
        status: 'ALIVE',
        buffs: { shield: 0, cloak: 0, insurance: false }
    }));

    for (const phase of rules.phases) {
        console.log(`\n>> ${phase.name}`);
        for (const round of phase.rounds) {
            console.log(` Round ${round.round} (Target: ${round.target} Tokens/Progress)`);
            
            // Simulate 15 spins per round for more survivors
            for (let s = 1; s <= 15; s++) {
                const roundTrace = [];
                gameState.filter(p => p.status === 'ALIVE').forEach(p => {
                    const r = Math.random();
                    let action = '';
                    if (r < 0.4) { p.progress += 3; action = 'Advance (+3)'; }
                    else if (r < 0.7) { p.sessionTokens += 8; action = 'Token (+8)'; }
                    else if (r < 0.9) {
                        const potentialTargets = gameState.filter(t => t.id !== p.id && t.status === 'ALIVE' && t.buffs.cloak <= 0);
                        const target = potentialTargets[0];
                        if (target) {
                            if (target.buffs.shield > 0) {
                                target.buffs.shield--;
                                action = `Steal ${target.username} (BLOCKED)`;
                            } else {
                                target.sessionTokens = Math.max(0, target.sessionTokens - 5);
                                p.sessionTokens += 5;
                                action = `Steal ${target.username} (-5)`;
                            }
                        } else { action = 'Steal (Fail)'; }
                    } else { p.buffs.shield = 5; action = 'Shield Active'; }
                    
                    if (s === 1 && round.round === 1 && phase.name === 'Phase 1') {
                        roundTrace.push(`${p.username} -> ${action}`);
                    }
                });
                
                if (s === 1 && round.round === 1 && phase.name === 'Phase 1') {
                    console.log(` [Round 1 Trace Sample]:`);
                    roundTrace.slice(0, 3).forEach(t => console.log(`  ${t}`));
                }
            }

            // ELIMINATION AT END OF ROUND
            const alive = gameState.filter(p => p.status === 'ALIVE');
            alive.forEach(p => {
                if (p.progress < round.target || p.sessionTokens < round.target) {
                    p.status = 'ELIMINATED';
                }
            });
            console.log(`  Players remaining: ${gameState.filter(p => p.status === 'ALIVE').length}`);
        }
    }

    // 5. FINAL SHOWDOWN
    console.log('\n--- 4. FINAL SHOWDOWN (Continuous Spinning) ---');
    let finalists = gameState.filter(p => p.status === 'ALIVE').sort((a,b) => b.sessionTokens - a.sessionTokens).slice(0, 2);
    
    // Ensure we have 2 finalists
    if (finalists.length < 2) {
        console.log("Not enough survivors for showdown. Picking top players.");
        finalists = gameState.sort((a,b) => b.sessionTokens - a.sessionTokens).slice(0, 2);
        finalists.forEach(f => f.status = 'ALIVE');
    }

    console.log(`Showdown: ${finalists[0].username} vs ${finalists[1].username}`);
    console.log(`Duration: ${session.rules.showdownDuration}s`);

    // Simulate 10 intense showdown spins
    for (let s = 1; s <= 10; s++) {
        finalists.forEach(p => {
            const r = Math.random();
            if (r < 0.5) p.sessionTokens += 5;
            else {
                const opponent = finalists.find(o => o.id !== p.id);
                opponent.sessionTokens = Math.max(0, opponent.sessionTokens - 10);
                p.sessionTokens += 10;
            }
        });
    }

    console.log(`Showdown End: ${finalists[0].username}: ${finalists[0].sessionTokens}, ${finalists[1].username}: ${finalists[1].sessionTokens}`);

    // 6. WINNER DETERMINATION & SUDDEN DEATH
    let winner;
    if (finalists[0].sessionTokens === finalists[1].sessionTokens) {
        console.log('SUDDEN DEATH ACTIVATED!');
        // First to +5
        finalists[0].sessionTokens += 5; // Simulating Bot 1 winning sudden death
        winner = finalists[0];
        console.log(`Winner via Sudden Death: ${winner.username}`);
    } else {
        winner = finalists.sort((a,b) => b.sessionTokens - a.sessionTokens)[0];
        console.log(`WINNER: ${winner.username} with ${winner.sessionTokens} tokens.`);
    }

    console.log('\n--- SIMULATION COMPLETE ---');
}

runV4FinalSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
