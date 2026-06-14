const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runChampionshipSimulation() {
    console.log('--- THE PHANTOM V4: CHAMPIONSHIP SESSION VALIDATION SIMULATION ---');

    // CONFIGURATION
    const TOTAL_PLAYERS = 100;
    const REAL_USERS = 1;
    const BOTS = 99;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    // SQUAD CONFIGURATION
    // 100 players. Let's say 40 are in pre-registered squads (groups of 4).
    // The rest (60) are solo players assigned to temporary squads (groups of 4).
    let players = [];
    
    // 1 Real User (Solo)
    players.push({
        id: 'user-1',
        username: 'MainPlayer (Human)',
        isBot: false,
        squadId: null,
        isRegisteredSquad: false,
        sessionTokens: 0,
        squadTokens: 0,
        status: 'ALIVE',
        phase1Tokens: 0
    });

    // 99 Bots
    for (let i = 2; i <= 100; i++) {
        players.push({
            id: `bot-${i}`,
            username: `Bot_${i}`,
            isBot: true,
            squadId: i <= 40 ? `reg-squad-${Math.ceil(i/4)}` : null,
            isRegisteredSquad: i <= 40,
            sessionTokens: 0,
            squadTokens: 0,
            status: 'ALIVE',
            phase1Tokens: 0
        });
    }

    // Assign Solo players to temporary squads
    let soloPlayers = players.filter(p => !p.squadId);
    for (let i = 0; i < soloPlayers.length; i++) {
        soloPlayers[i].squadId = `temp-squad-${Math.ceil((i+1)/4)}`;
    }

    console.log(`\n1. Participation Summary:`);
    console.log(`- Total Players: ${players.length}`);
    console.log(`- Real Users: ${REAL_USERS}`);
    console.log(`- Bots: ${BOTS}`);
    console.log(`- Entry Fee: $${ENTRY_FEE}`);
    console.log(`- Total Pool: $${TOTAL_POOL}`);

    console.log(`\n2. Squad Distribution Summary:`);
    const regSquadCount = new Set(players.filter(p => p.isRegisteredSquad).map(p => p.squadId)).size;
    const tempSquadCount = new Set(players.filter(p => !p.isRegisteredSquad).map(p => p.squadId)).size;
    console.log(`- Registered Squads: ${regSquadCount}`);
    console.log(`- Temporary Squads: ${tempSquadCount}`);

    // PHASE 1: Target-Based Survival
    console.log(`\n3. Phase 1 Results (Target: 60 Tokens Total)`);
    // 3 Rounds. Target 20 each. 
    // We'll simulate 3 rounds.
    for (let round = 1; round <= 3; round++) {
        players.filter(p => p.status === 'ALIVE').forEach(p => {
            // Simulate token gain: average 20-30 per round
            const gain = Math.floor(Math.random() * 15) + 12; // 12-26 tokens
            p.sessionTokens += gain;
            p.phase1Tokens += gain;
            
            // Squad tokens: 0-2 per round
            if (Math.random() > 0.7) p.squadTokens += 1;
        });
    }

    // Elimination at end of Phase 1
    const PHASE_1_TARGET = 60;
    players.forEach(p => {
        if (p.phase1Tokens < PHASE_1_TARGET) {
            p.status = 'ELIMINATED_PENDING_REVIVE';
        }
    });

    const initialEliminated = players.filter(p => p.status === 'ELIMINATED_PENDING_REVIVE').length;
    console.log(`- Players who failed target (${PHASE_1_TARGET} tokens): ${initialEliminated}`);

    // Revive Logic
    // Revive Rules: Costs 3 squad tokens. Squadmates contribute.
    const squads = [...new Set(players.map(p => p.squadId))];
    squads.forEach(sid => {
        let squadMembers = players.filter(p => p.squadId === sid);
        let eliminated = squadMembers.filter(p => p.status === 'ELIMINATED_PENDING_REVIVE');
        let alive = squadMembers.filter(p => p.status === 'ALIVE');
        
        let totalSquadTokens = squadMembers.reduce((acc, p) => acc + p.squadTokens, 0);

        for (let target of eliminated) {
            if (totalSquadTokens >= 3) {
                // If bot teammates and target is human, bot teammates cannot revive human players
                if (target.isBot === false && alive.every(a => a.isBot)) {
                    // Cannot revive
                    target.status = 'ELIMINATED';
                    continue;
                }
                
                totalSquadTokens -= 3;
                target.status = 'ALIVE';
                target.revived = true;
            } else {
                target.status = 'ELIMINATED';
            }
        }
    });

    const finalPhase1Survivors = players.filter(p => p.status === 'ALIVE').length;
    const revivedCount = players.filter(p => p.revived).length;
    console.log(`- Players Revived: ${revivedCount}`);
    console.log(`- Total Phase 1 Survivors: ${finalPhase1Survivors}`);

    // PHASE 2: Bottom 60% elimination
    console.log(`\n4. Phase 2 Results (Eliminate Bottom 60%)`);
    for (let round = 1; round <= 3; round++) {
        players.filter(p => p.status === 'ALIVE').forEach(p => {
            p.sessionTokens += Math.floor(Math.random() * 25) + 15;
        });
    }

    let aliveP2 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.sessionTokens - a.sessionTokens);
    let eliminateCountP2 = Math.floor(aliveP2.length * 0.6);
    let eliminatedP2 = aliveP2.slice(aliveP2.length - eliminateCountP2);
    eliminatedP2.forEach(p => p.status = 'ELIMINATED');

    console.log(`- Survivors entering Phase 2: ${aliveP2.length}`);
    console.log(`- Eliminated (Bottom 60%): ${eliminateCountP2}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // PHASE 3: Bottom 75% elimination
    console.log(`\n5. Phase 3 Results (Eliminate Bottom 75%)`);
    for (let round = 1; round <= 3; round++) {
        players.filter(p => p.status === 'ALIVE').forEach(p => {
            p.sessionTokens += Math.floor(Math.random() * 30) + 20;
        });
    }

    let aliveP3 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.sessionTokens - a.sessionTokens);
    let eliminateCountP3 = Math.floor(aliveP3.length * 0.75);
    let eliminatedP3 = aliveP3.slice(aliveP3.length - eliminateCountP3);
    eliminatedP3.forEach(p => p.status = 'ELIMINATED');

    console.log(`- Survivors entering Phase 3: ${aliveP3.length}`);
    console.log(`- Eliminated (Bottom 75%): ${eliminateCountP3}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // PHASE 4: Championship
    console.log(`\n6. Championship Results (No Eliminations)`);
    for (let round = 1; round <= 3; round++) {
        players.filter(p => p.status === 'ALIVE').forEach(p => {
            p.sessionTokens += Math.floor(Math.random() * 40) + 30;
        });
    }
    const finalSurvivors = players.filter(p => p.status === 'ALIVE').length;
    console.log(`- Final Survivors: ${finalSurvivors}`);

    // RESULTS
    console.log(`\n7. Top 20 Leaderboard:`);
    const leaderboard = players.sort((a,b) => b.sessionTokens - a.sessionTokens).slice(0, 20);
    leaderboard.forEach((p, i) => {
        console.log(`${i+1}. ${p.username} ${p.status === 'ALIVE' ? '[SURVIVOR]' : '[ELIMINATED]'} - ${p.sessionTokens} tokens`);
    });

    console.log(`\n8. Survivor Distribution Statistics:`);
    const survivors = players.filter(p => p.status === 'ALIVE');
    const humanSurvivor = survivors.find(p => !p.isBot);
    console.log(`- Human Survivors: ${humanSurvivor ? 1 : 0}`);
    console.log(`- Bot Survivors: ${survivors.filter(p => p.isBot).length}`);
    const regSquadSurvivors = survivors.filter(p => p.isRegisteredSquad).length;
    const tempSquadSurvivors = survivors.filter(p => !p.isRegisteredSquad).length;
    console.log(`- Registered Squad Survivors: ${regSquadSurvivors}`);
    console.log(`- Temporary Squad Survivors: ${tempSquadSurvivors}`);

    console.log(`\n9. Economy Snapshot:`);
    const platformShare = TOTAL_POOL * 0.20;
    const winnerShare = TOTAL_POOL * 0.30;
    const remainingPool = TOTAL_POOL - platformShare - winnerShare;
    console.log(`- Total Pool: $${TOTAL_POOL}`);
    console.log(`- Platform Share (20%): $${platformShare}`);
    console.log(`- Winner Share (30%): $${winnerShare}`);
    console.log(`- Remaining Pool: $${remainingPool}`);

    console.log('\n--- SIMULATION COMPLETE ---');
}

runChampionshipSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
