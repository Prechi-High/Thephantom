const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runUpdatedRuleEngine() {
    console.log('--- THE PHANTOM V4: RULE ENGINE ENFORCEMENT ---');

    // 1. SESSION ECONOMY CONFIGURATION (RANDOMIZATION)
    const ENTRY_FEE = 5;
    const TOTAL_PLAYERS = 100;
    const PRIZE_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    let platform_share_pct = (Math.floor(Math.random() * 11) + 15) / 100; // 15% to 25%
    let winner_share_pct = (Math.floor(Math.random() * 16) + 20) / 100;   // 20% to 35%

    // Constraint: platform + winner <= 60%
    if ((platform_share_pct + winner_share_pct) > 0.60) {
        winner_share_pct = 0.60 - platform_share_pct;
    }

    const platform_amt = PRIZE_POOL * platform_share_pct;
    const winner_amt = PRIZE_POOL * winner_share_pct;
    const survivor_pool_total = PRIZE_POOL - platform_amt - winner_amt;

    console.log(`\n[1. SESSION ECONOMY CONFIGURATION]`);
    console.log(`- Entry Fee: $${ENTRY_FEE}`);
    console.log(`- Total Prize Pool: $${PRIZE_POOL}`);
    console.log(`- Platform Share: ${(platform_share_pct * 100).toFixed(1)}% ($${platform_amt.toFixed(2)})`);
    console.log(`- Winner Share: ${(winner_share_pct * 100).toFixed(1)}% ($${winner_amt.toFixed(2)})`);
    console.log(`- Initial Survivor Pool: $${survivor_pool_total.toFixed(2)}`);

    // 2. PLAYER & SQUAD INITIALIZATION
    let players = [];
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        players.push({
            id: i,
            username: i === 1 ? 'MainPlayer (Real)' : `Bot_${i}`,
            session_tokens: 0,
            squad_id: Math.ceil(i / 4),
            status: 'ALIVE',
            squad_tokens: 0
        });
    }

    let squads = [];
    for (let i = 1; i <= 25; i++) {
        squads.push({ id: i, revive_pool_tokens: 0 });
    }

    // 3. PHASE 1 EXECUTION (Target: 20)
    for (let round = 1; round <= 3; round++) {
        players.forEach(p => {
            const gain = Math.floor(Math.random() * 15); // 0-14 tokens
            p.session_tokens += gain;
            if (Math.random() > 0.8) {
                squads.find(s => s.id === p.squad_id).revive_pool_tokens += 1;
            }
        });
    }

    console.log(`\n[2. PHASE 1 RESERVE POOL RESULTS]`);
    players.forEach(p => {
        if (p.session_tokens < 20) p.status = 'RESERVE_ELIGIBLE';
    });
    
    const initialReserveCount = players.filter(p => p.status === 'RESERVE_ELIGIBLE').length;
    console.log(`- Players < 20 Tokens: ${initialReserveCount}`);

    // Revive Execution
    let revived = 0;
    squads.forEach(s => {
        const reserve = players.filter(p => p.squad_id === s.id && p.status === 'RESERVE_ELIGIBLE');
        while (s.revive_pool_tokens >= 3 && reserve.length > 0) {
            const p = reserve.pop();
            s.revive_pool_tokens -= 3;
            p.status = 'ALIVE';
            revived++;
        }
    });
    players.filter(p => p.status === 'RESERVE_ELIGIBLE').forEach(p => p.status = 'ELIMINATED');
    console.log(`- Revived via Squad Tokens: ${revived}`);
    console.log(`- Final Phase 1 Survivors: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 4. PHASE 2 & 3 ELIMINATIONS (Simulation of P2: -60%, P3: -70%)
    const runElimination = (phase, percent) => {
        players.filter(p => p.status === 'ALIVE').forEach(p => p.session_tokens += Math.floor(Math.random() * 20));
        const alive = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
        const elimCount = Math.floor(alive.length * percent);
        alive.slice(alive.length - elimCount).forEach(p => p.status = 'ELIMINATED');
        return elimCount;
    };

    console.log(`\n[3. PHASE 2 & 3 ELIMINATION LOGS]`);
    console.log(`- Phase 2 Eliminated (Bottom 60%): ${runElimination(2, 0.60)}`);
    console.log(`- Phase 3 Eliminated (Bottom 70%): ${runElimination(3, 0.70)}`);
    
    const finalSurvivors = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
    console.log(`- Final Survivors remaining: ${finalSurvivors.length}`);

    // 5. SURVIVOR RANKING & DISTRIBUTION
    console.log(`\n[4. SURVIVOR RANKING BREAKDOWN]`);
    finalSurvivors.forEach((s, i) => {
        console.log(`  Rank ${i+1}: ${s.username} (${s.session_tokens} tokens)`);
    });

    // Top 15% Identification
    const top15Count = Math.max(1, Math.ceil(finalSurvivors.length * 0.15));
    const top15Group = finalSurvivors.slice(0, top15Count);
    
    // 6. REFUND EXECUTION LOG
    console.log(`\n[5. REFUND EXECUTION LOG]`);
    const refundCount = Math.max(1, Math.floor(top15Group.length * 0.10));
    const refundGroup = top15Group.slice(top15Group.length - refundCount);
    const totalRefundAmt = refundGroup.length * ENTRY_FEE;
    
    refundGroup.forEach(p => {
        console.log(`- Refund Issued: ${p.username} ($${ENTRY_FEE})`);
        p.isRefunded = true;
    });
    console.log(`- Total Refund Deduction: $${totalRefundAmt.toFixed(2)}`);

    // 7. SURVIVOR POOL DISTRIBUTION
    const remaining_survivor_pool = survivor_pool_total - totalRefundAmt;
    const top_performer_pool = remaining_survivor_pool * 0.60;
    const squad_member_pool = remaining_survivor_pool * 0.40;

    console.log(`\n[6. TOP 15% DISTRIBUTION BREAKDOWN]`);
    console.log(`- Top 15% Group Size: ${top15Group.length} players`);
    console.log(`- Top 5% Performers Pool (60%): $${top_performer_pool.toFixed(2)}`);
    
    // 8. SQUAD POOL ALLOCATION
    console.log(`\n[7. SQUAD POOL ALLOCATION BREAKDOWN]`);
    console.log(`- Squad Members Pool (40%): $${squad_member_pool.toFixed(2)}`);
    console.log(`- Criteria: Strength, Tokens, Presence.`);

    // 9. FINAL LEADERBOARD
    console.log(`\n[8. FINAL LEADERBOARD]`);
    const winner = finalSurvivors[0];
    const top5PercentCount = Math.max(1, Math.ceil(finalSurvivors.length * 0.05));
    const top5Group = finalSurvivors.slice(0, top5PercentCount);

    finalSurvivors.slice(0, 10).forEach((p, i) => {
        let payout = 0;
        if (i === 0) payout += winner_amt; // Winner share
        if (top5Group.includes(p)) payout += (top_performer_pool / top5Group.length);
        if (p.isRefunded) payout += ENTRY_FEE;
        
        console.log(`${i+1}. ${p.username} | ${p.session_tokens} Tokens | Payout: $${payout.toFixed(2)}`);
    });

    console.log('\n--- SYSTEM UPDATE ENFORCED ---');
}

runUpdatedRuleEngine()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
