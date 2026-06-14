const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDetailedPhase1Simulation() {
    console.log('--- THE PHANTOM V4: DETAILED PHASE 1 SIMULATION ---');

    // 1. ECONOMY CONFIGURATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    const platform_pct = (Math.floor(Math.random() * 11) + 15) / 100; // 15-25%
    const winner_pct = (Math.floor(Math.random() * 16) + 20) / 100;   // 20-35%
    const platform_amt = TOTAL_POOL * platform_pct;
    const winner_amt = TOTAL_POOL * winner_pct;

    // 2. PLAYER & SQUAD INITIALIZATION
    let players = [];
    let squads = [];

    for (let s = 1; s <= 25; s++) {
        squads.push({ id: s, revive_tokens: 0, revived_count: 0 });
    }

    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        const squadId = Math.ceil(i / 4);
        players.push({
            user_id: i,
            squad_id: squadId,
            tokens_earned: 0,
            tier: '',
            reason: '',
            revive_eligible: false,
            revive_status: 'not_applicable',
            final_status: 'PENDING'
        });
    }

    // 3. TOKEN GENERATION (3 Rounds)
    for (let round = 1; round <= 3; round++) {
        players.forEach(p => {
            // Token distribution tuned to hit all tiers
            const gain = Math.floor(Math.random() * 30) + 5; // 5-34 tokens per round
            p.tokens_earned += gain;
            
            // Random squad token generation
            if (Math.random() > 0.75) {
                squads.find(s => s.id === p.squad_id).revive_tokens += 1;
            }
        });
    }

    // 4. CLASSIFICATION
    players.forEach(p => {
        if (p.tokens_earned >= 60) {
            p.tier = 'PASS';
            p.reason = 'Tokens ≥ 60';
            p.revive_eligible = false;
            p.final_status = 'ADVANCED';
        } else if (p.tokens_earned >= 40) {
            p.tier = 'RESERVABLE';
            p.reason = '40 ≤ Tokens < 60';
            p.revive_eligible = true;
            p.final_status = 'PENDING_REVIVE';
        } else {
            p.tier = 'ELIMINATED';
            p.reason = 'Tokens < 40';
            p.revive_eligible = false;
            p.final_status = 'ELIMINATED';
        }
    });

    // 5. REVIVE LOGIC
    let revive_logs = [];
    squads.forEach(s => {
        let reservable = players.filter(p => p.squad_id === s.id && p.tier === 'RESERVABLE');
        while (s.revive_tokens >= 3 && reservable.length > 0) {
            let p = reservable.shift();
            s.revive_tokens -= 3;
            p.revive_status = 'revived';
            p.final_status = 'ADVANCED';
            s.revived_count++;
            revive_logs.push(`Squad ${s.id} revived User ${p.user_id} (Cost: 3 Tokens)`);
        }
        // Update remaining reservable
        reservable.forEach(p => {
            p.revive_status = 'not_revived';
            p.final_status = 'ELIMINATED';
        });
    });

    // 6. OUTPUT: PHASE 1 DETAILED PLAYER TABLE
    console.log('\n1. PHASE 1 DETAILED PLAYER TABLE');
    console.log('ID | SQ | TOKENS | TIER | REASON | REV_ELIG | REV_STAT | FINAL_STAT');
    console.log('-----------------------------------------------------------------------');
    players.forEach(p => {
        console.log(`${p.user_id.toString().padEnd(2)} | ${p.squad_id.toString().padEnd(2)} | ${p.tokens_earned.toString().padEnd(6)} | ${p.tier.padEnd(10)} | ${p.reason.padEnd(14)} | ${p.revive_eligible.toString().padEnd(8)} | ${p.revive_status.padEnd(12)} | ${p.final_status}`);
    });

    // 7. CLASSIFICATION SUMMARY
    const passCount = players.filter(p => p.tier === 'PASS').length;
    const reservableCount = players.filter(p => p.tier === 'RESERVABLE').length;
    const eliminatedCount = players.filter(p => p.tier === 'ELIMINATED').length;
    const totalRevived = players.filter(p => p.revive_status === 'revived').length;

    console.log('\n2. CLASSIFICATION SUMMARY');
    console.log(`- Total Players: ${TOTAL_PLAYERS}`);
    console.log(`- Pass Count (Tier A): ${passCount}`);
    console.log(`- Reservable Count (Tier B): ${reservableCount}`);
    console.log(`- Eliminated Count (Tier C): ${eliminatedCount}`);
    console.log(`- Total Revive Actions: ${totalRevived}`);

    // 8. SQUAD REVIVE LOG
    console.log('\n3. SQUAD REVIVE LOG');
    if (revive_logs.length > 0) {
        revive_logs.forEach(log => console.log(`- ${log}`));
    } else {
        console.log('- No revives occurred.');
    }
    
    const usedSquads = squads.filter(s => s.revived_count > 0);
    console.log(`- Squad Revive Usage: ${usedSquads.length} squads successfully used tokens.`);

    // 9. ECONOMY SNAPSHOT
    console.log('\n4. ECONOMY SNAPSHOT');
    console.log(`- Platform Fee (${(platform_pct * 100).toFixed(1)}%): $${platform_amt.toFixed(2)}`);
    console.log(`- Winner Allocation (${(winner_pct * 100).toFixed(1)}%): $${winner_amt.toFixed(2)}`);
    console.log(`- Potential Survivor Pool: $${(TOTAL_POOL - platform_amt - winner_amt).toFixed(2)}`);

    // 10. SYSTEM ANALYSIS
    console.log('\n5. SYSTEM ANALYSIS');
    if (eliminatedCount > 40) {
        console.log('- [WARNING]: High elimination rate in Phase 1. Check token generation balance.');
    } else if (totalRevived < (reservableCount * 0.2)) {
        console.log('- [OBSERVATION]: Squad tokens are rare; few eligible players were revived.');
    } else {
        console.log('- [STABLE]: Pacing and revive metrics within expected ranges.');
    }

    console.log('\n--- SIMULATION COMPLETE ---');
}

runDetailedPhase1Simulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
