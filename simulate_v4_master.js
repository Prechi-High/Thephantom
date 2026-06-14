const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * THE PHANTOM V4: MASTER SPECIFICATION SIMULATION
 * Based on Master Prompt Specification
 */

async function runMasterSimulation() {
    console.log('--- THE PHANTOM V4: MASTER SPECIFICATION EXECUTION ---');

    // 1. INITIALIZATION & SCHEMA ALIGNMENT
    const TOTAL_PLAYERS = 100;
    const REAL_USERS = 1;
    const BOTS = 99;
    const ENTRY_FEE = 5;
    const PLATFORM_CUT_PCT = 0.20;
    const WINNER_CUT_PCT = 0.30;
    const PRIZE_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    let players = [];
    
    // Create Players (Schema: Users)
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        const isReal = i === 1;
        players.push({
            id: i,
            username: isReal ? 'MainPlayer (Real)' : `Bot_${i}`,
            type: isReal ? 'REAL' : 'BOT',
            balance: 500 - ENTRY_FEE,
            session_tokens: 0,
            squad_id: null,
            status: 'ALIVE',
            shield_active: false,
            cloak_active: false,
            phase_tokens: 0, // Reset per phase for target tracking if needed
            squad_tokens: 0, // Generated for revive pool
            is_eliminated: false
        });
    }

    // 2. SQUAD ASSIGNMENT (Schema: Squads)
    // 40 players in 10 Registered Squads (id 1-10)
    // 60 players in 15 Temporary Squads (id 11-25)
    let squads = [];
    for (let i = 1; i <= 25; i++) {
        squads.push({
            id: i,
            name: i <= 10 ? `RegSquad_${i}` : `TempSquad_${i}`,
            type: i <= 10 ? 'REGISTERED' : 'TEMP',
            revive_pool_tokens: 0
        });
    }

    players.forEach((p, idx) => {
        const squadId = Math.floor(idx / 4) + 1;
        p.squad_id = squadId;
    });

    // 3. SUBSESSION ROUTER
    const sub_sessions = [
        { id: 1, capacity: 110, phase: 1, round: 1, status: 'ACTIVE', players: players }
    ];

    console.log(`\n[SESSION SUMMARY]`);
    console.log(`- Total Players: ${TOTAL_PLAYERS}`);
    console.log(`- Prize Pool: $${PRIZE_POOL}`);
    console.log(`- Sub-sessions: 1 (Capacity ${sub_sessions[0].players.length}/110)`);

    // 4. GAME ENGINE
    const runRound = (phaseNum, roundNum) => {
        const roundLogs = [];
        players.filter(p => p.status === 'ALIVE').forEach(p => {
            // resolveSpin logic
            const r = Math.random();
            let action = '';
            let tokenChange = 0;

            if (r < 0.2) { // TOKEN
                tokenChange = 10;
                action = 'TOKEN';
            } else if (r < 0.4) { // HALF_TOKEN
                tokenChange = 5;
                action = 'HALF_TOKEN';
            } else if (r < 0.6) { // ADVANCE
                tokenChange = 3;
                action = 'ADVANCE';
            } else if (r < 0.75) { // STEAL
                // Steal Logic
                const potentialTargets = players.filter(t => 
                    t.id !== p.id && 
                    t.status === 'ALIVE' && 
                    t.squad_id !== p.squad_id && 
                    !t.cloak_active
                ).sort((a,b) => b.session_tokens - a.session_tokens);

                const target = potentialTargets[0];
                if (target) {
                    if (target.shield_active) {
                        target.shield_active = false; // Consume shield
                        action = `STEAL (BLOCKED by ${target.username})`;
                    } else {
                        const amount = Math.min(target.session_tokens, 8);
                        target.session_tokens -= amount;
                        tokenChange = amount;
                        action = `STEAL from ${target.username} (+${amount})`;
                    }
                } else {
                    action = 'STEAL (NO TARGET)';
                }
            } else if (r < 0.85) { // SHIELD
                p.shield_active = true;
                action = 'SHIELD ACTIVATE';
            } else if (r < 0.95) { // CLOAK
                p.cloak_active = true;
                action = 'CLOAK ACTIVATE';
            } else {
                action = 'MISS';
            }

            p.session_tokens += tokenChange;
            p.phase_tokens += tokenChange;
            
            // Random squad token generation
            if (Math.random() > 0.8) {
                const squad = squads.find(s => s.id === p.squad_id);
                squad.revive_pool_tokens += 1;
            }
        });
    };

    // TOURNAMENT LOOP
    for (let phase = 1; phase <= 4; phase++) {
        const rounds = phase === 4 ? 3 : 3; // All phases 3 rounds for sim
        for (let round = 1; round <= rounds; round++) {
            runRound(phase, round);
        }

        console.log(`\n[PHASE ${phase} ELIMINATION LOGS]`);
        const aliveBefore = players.filter(p => p.status === 'ALIVE').length;

        if (phase === 1) {
            // PHASE 1: < 60 tokens eliminate
            players.forEach(p => {
                if (p.status === 'ALIVE' && p.session_tokens < 60) {
                    p.status = 'PENDING_REVIVE';
                }
            });
            
            const failTarget = players.filter(p => p.status === 'PENDING_REVIVE').length;
            console.log(`- Failed Phase 1 Target (60): ${failTarget}`);

            // REVIVE ENGINE
            let revivedCount = 0;
            squads.forEach(s => {
                const pending = players.filter(p => p.squad_id === s.id && p.status === 'PENDING_REVIVE');
                while (s.revive_pool_tokens >= 3 && pending.length > 0) {
                    const p = pending.pop();
                    s.revive_pool_tokens -= 3;
                    p.status = 'ALIVE';
                    revivedCount++;
                }
            });
            players.filter(p => p.status === 'PENDING_REVIVE').forEach(p => p.status = 'ELIMINATED');
            console.log(`- Revived: ${revivedCount}`);
        } else if (phase === 2) {
            // PHASE 2: bottom 60%
            const alive = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
            const elimCount = Math.floor(alive.length * 0.60);
            alive.slice(alive.length - elimCount).forEach(p => p.status = 'ELIMINATED');
            console.log(`- Eliminated bottom 60%: ${elimCount}`);
        } else if (phase === 3) {
            // PHASE 3: bottom 70%
            const alive = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
            const elimCount = Math.floor(alive.length * 0.70);
            alive.slice(alive.length - elimCount).forEach(p => p.status = 'ELIMINATED');
            console.log(`- Eliminated bottom 70%: ${elimCount}`);
        } else {
            console.log(`- Championship Phase: No eliminations.`);
        }

        const aliveAfter = players.filter(p => p.status === 'ALIVE').length;
        console.log(`- Survivors: ${aliveAfter}`);
    }

    // 5. ECONOMY ENGINE
    console.log(`\n[ECONOMY BREAKDOWN]`);
    const platformAmt = PRIZE_POOL * PLATFORM_CUT_PCT;
    const winnerAmt = PRIZE_POOL * WINNER_CUT_PCT;
    const remainingPool = PRIZE_POOL * 0.50;

    // Remaining distribution: 10% refund, 70% top, 20% squad
    const refundPool = remainingPool * 0.10;
    const topPerformersPool = remainingPool * 0.70;
    const squadPool = remainingPool * 0.20;

    const survivors = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
    const winner = survivors[0];

    console.log(`- Total Pool: $${PRIZE_POOL}`);
    console.log(`- Platform Fee (20%): $${platformAmt}`);
    console.log(`- Winner Payout (30%): $${winnerAmt} (Winner: ${winner.username})`);
    console.log(`- Remaining Pool (50%): $${remainingPool}`);
    console.log(`  - Refund Tier (10%): $${refundPool}`);
    console.log(`  - Top Performers (70%): $${topPerformersPool}`);
    console.log(`  - Squad Pool (20%): $${squadPool}`);

    // 6. SQUAD IMPACT REPORT
    console.log(`\n[SQUAD IMPACT REPORT]`);
    const regSurvivors = survivors.filter(p => squads.find(s => s.id === p.squad_id).type === 'REGISTERED').length;
    const tempSurvivors = survivors.filter(p => squads.find(s => s.id === p.squad_id).type === 'TEMP').length;
    console.log(`- Registered Squad Survivors: ${regSurvivors}`);
    console.log(`- Temporary Squad Survivors: ${tempSurvivors}`);
    const totalSquadTokens = squads.reduce((acc, s) => acc + s.revive_pool_tokens, 0);
    console.log(`- Unused Revive Tokens in Pools: ${totalSquadTokens}`);

    console.log(`\n[FINAL LEADERBOARD (Top 10)]`);
    players.sort((a,b) => b.session_tokens - a.session_tokens).slice(0, 10).forEach((p, i) => {
        console.log(`${i+1}. ${p.username} - ${p.session_tokens} tokens (${p.status})`);
    });

    console.log('\n--- SIMULATION COMPLETE ---');
}

runMasterSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
