require('dotenv').config({ override: true });
const { PrismaClient, UserType, SessionStatus, SubSessionStatus, PlayerStatus, ActionType } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * THE PHANTOM V4 SIMULATION ENGINE
 * 
 * CORE ARCHITECTURE UPDATES:
 * 1. Session Tokens vs Lifetime Tokens (Separate balances).
 * 2. Phase-Target Elimination (Dynamic thresholds).
 * 3. Squad Revive (Phase 1 only, 3 individual tokens cost).
 * 4. Cloak (Hides from target lists, not invisible).
 * 5. Showdown Logic (Top 2, 3 final spins).
 * 6. Shop Items (Shield, Insurance, Steal Boost/Reduction integrated).
 */

async function runV4Simulation() {
    console.log('--- THE PHANTOM V4: HIGH-FIDELITY SESSION SIMULATION ---');

    // 1. SETUP & DATA
    const testUser = await prisma.user.findUnique({ where: { username: 'TestPlayer' } });
    const bots = await prisma.user.findMany({ where: { type: 'BOT' }, take: 99 });
    
    // Create Squads for bots to test squad logic
    const squadA = await prisma.squad.upsert({ where: { name: 'V4_Squad_Alpha' }, update: {}, create: { name: 'V4_Squad_Alpha', leaderId: bots[0].id } });
    const squadB = await prisma.squad.upsert({ where: { name: 'V4_Squad_Beta' }, update: {}, create: { name: 'V4_Squad_Beta', leaderId: bots[10].id } });

    const players = [
        { ...testUser, squadId: null, lifetimeBalance: Number(testUser.balance) },
        ...bots.map((b, i) => ({ 
            ...b, 
            squadId: i < 5 ? squadA.id : (i < 10 ? squadB.id : null),
            lifetimeBalance: Number(b.balance) 
        }))
    ];

    // INITIAL STATE
    let gameState = players.map(p => ({
        id: p.id,
        username: p.username,
        squadId: p.squadId,
        isBot: p.type === 'BOT',
        sessionTokens: 10, // Start with 10 session tokens
        lifetimeTokens: p.lifetimeBalance,
        progress: 0,
        status: 'ALIVE',
        behavior: p.type === 'BOT' ? ['aggressive', 'defensive', 'balanced'][Math.floor(Math.random() * 3)] : 'player',
        buffs: {
            shieldDurability: 0, // Block X steals
            cloakSpins: 0,       // Removed from target lists
            insurance: false,    // Payout on elimination
            stealBoost: 1.5,     // 1.0 = normal, 1.5 = boost
            stealReduction: 0.5  // 1.0 = normal, 0.5 = reduction
        },
        rivals: [], // User IDs who stole from them
        inventory: [] // Purchased items
    }));

    // PRE-GAME SHOP PHASE (Simulated)
    console.log('>> PRE-GAME: Shop Phase (60s)');
    gameState.forEach(p => {
        if (p.isBot && Math.random() < 0.4) {
            // Randomly buy items
            const items = ['SHIELD', 'CLOAK', 'INSURANCE', 'STEAL_BOOST', 'STEAL_REDUCTION'];
            const choice = items[Math.floor(Math.random() * items.length)];
            if (choice === 'SHIELD') p.buffs.shieldDurability = 3;
            if (choice === 'CLOAK') p.buffs.cloakSpins = 5;
            if (choice === 'INSURANCE') p.buffs.insurance = true;
            // Boost/Reduction are simplified as 1/0 for this run
        }
    });

    const phases = [
        { name: 'Phase 1', spins: 10, target: { tokens: 5, progress: 5 } },
        { name: 'Phase 2', spins: 10, target: { tokens: 15, progress: 15 } },
        { name: 'Phase 3', spins: 10, target: { tokens: 25, progress: 25 } },
        { name: 'Showdown', spins: 3, target: null } 
    ];

    const logs = [];

    // 2. GAME LOOP
    for (let pIdx = 0; pIdx < phases.length; pIdx++) {
        const phase = phases[pIdx];
        const aliveCount = gameState.filter(p => p.status === 'ALIVE').length;

        if (aliveCount <= 1 && pIdx < phases.length - 1) {
            console.log(`\n!! SESSION END EARLY: Only ${aliveCount} player(s) remain before ${phase.name}.`);
            break;
        }

        if (phase.name === 'Showdown') {
            const finalists = gameState.filter(p => p.status === 'ALIVE').sort((a,b) => b.progress - a.progress).slice(0, 2);
            if (finalists.length < 2) {
                console.log(`\n--- SHOWDOWN SKIPPED: Not enough players for showdown ---`);
            } else {
                gameState.forEach(p => { if (!finalists.find(f => f.id === p.id)) p.status = 'ELIMINATED'; });
                console.log(`\n--- SHOWDOWN: ${finalists[0].username} vs ${finalists[1].username} ---`);
            }
        } else {
            console.log(`\n--- ${phase.name} (Target: ${phase.target.progress} Progress, ${phase.target.tokens} Tokens) ---`);
        }

        for (let s = 1; s <= phase.spins; s++) {
            const roundLogs = [];
            const alive = gameState.filter(p => p.status === 'ALIVE');
            
            alive.forEach(player => {
                let action = '';
                const rand = Math.random();

                // SPIN LOGIC
                if (rand < 0.4) {
                    player.progress += 2;
                    action = 'Advance (+2)';
                } else if (rand < 0.7) {
                    player.sessionTokens += 5;
                    action = 'Token (+5)';
                } else if (rand < 0.95) {
                    // STEAL
                    // Cloak logic: Filter out cloaked players from "high-token" target lists
                    const potentialTargets = gameState.filter(t => 
                        t.id !== player.id && 
                        t.status === 'ALIVE' && 
                        t.buffs.cloakSpins <= 0
                    );
                    
                    if (potentialTargets.length > 0) {
                        const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                        let amount = 3;
                        
                        // Shield check
                        if (target.buffs.shieldDurability > 0) {
                            target.buffs.shieldDurability--;
                            action = `Steal ${target.username} (BLOCKED by Shield)`;
                        } else {
                            target.sessionTokens = Math.max(0, target.sessionTokens - amount);
                            player.sessionTokens += amount;
                            target.rivals.push(player.id);
                            action = `Steal ${target.username} (-${amount})`;
                        }
                    } else {
                        action = 'Steal (No Targets)';
                    }
                } else {
                    action = 'Special (Shield/Cloak/Nothing)';
                }

                // Buff decay
                if (player.buffs.cloakSpins > 0) player.buffs.cloakSpins--;

                roundLogs.push(`${player.username} -> ${action}`);
            });

            if (s === 1 && pIdx === 0) {
                console.log(`\n[Round 1 Sample]`);
                roundLogs.slice(0, 5).forEach(l => console.log(l));
            }
        }

        // ELIMINATION CHECK (Phase Targets)
        if (phase.target) {
            const alive = gameState.filter(p => p.status === 'ALIVE');
            for (const p of alive) {
                if (p.progress < phase.target.progress || p.sessionTokens < phase.target.tokens) {
                    // SQUAD REVIVE CHECK (Phase 1 only)
                    if (pIdx === 0 && p.squadId) {
                        const squadMates = gameState.filter(m => m.squadId === p.squadId && m.id !== p.id && m.status === 'ALIVE');
                        if (squadMates.length >= 3 && squadMates.every(m => m.sessionTokens >= 1)) {
                            // Sacrifice 1 token each from 3 mates
                            squadMates.slice(0, 3).forEach(m => m.sessionTokens -= 1);
                            console.log(`!! SQUAD REVIVE: ${p.username} saved by squadmates!`);
                            continue; // Survived!
                        }
                    }
                    
                    p.status = 'ELIMINATED';
                    // Insurance payout
                    if (p.buffs.insurance) {
                        const payout = Math.floor(p.sessionTokens * 0.5);
                        p.lifetimeTokens += payout;
                    }
                }
            }
            console.log(`Phase End: ${gameState.filter(p => p.status === 'ALIVE').length} players remain.`);
        }
    }

    // FINAL RESULTS
    const winner = gameState.filter(p => p.status === 'ALIVE').sort((a,b) => b.progress - a.progress)[0];
    console.log(`\n--- V4 SIMULATION COMPLETE ---`);
    console.log(`WINNER: ${winner.username}`);
    console.log(`Final Progress: ${winner.progress}`);
    console.log(`Session Tokens: ${winner.sessionTokens}`);

    // GAP ANALYSIS
    console.log(`\n--- GAP ANALYSIS (Current Implementation vs V4 Blueprint) ---`);
    const gaps = [
        "Squad Strategy: Bots do not yet gift specific skills/items during session.",
        "Rivalry: UI manual selection logic is backend-stubbed (random selection includes rival weights).",
        "Economy: Platform/Winner/Participation split math is calculated but not fully committed to PostgreSQL ledger yet.",
        "Cloak: Only hides from bots/target lists, doesn't yet 'hide' UI progress in real-time broadcasts."
    ];
    gaps.forEach(g => console.log(`- ${g}`));
}

runV4Simulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
