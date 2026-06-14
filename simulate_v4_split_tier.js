const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSplitTierSimulation() {
    console.log('--- THE PHANTOM V4: 5/10 SPLIT REFUND LOGIC SIMULATION ---');

    // 1. SESSION INITIALIZATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    // RANDOM ECONOMY GENERATION
    const platform_share_pct = (Math.floor(Math.random() * 11) + 15) / 100; // 15-25%
    const winner_share_pct = (Math.floor(Math.random() * 16) + 20) / 100;   // 20-35%
    
    const platform_fee_amt = TOTAL_POOL * platform_share_pct;
    const winner_allocation_amt = TOTAL_POOL * winner_share_pct;
    const initial_survivor_pool = TOTAL_POOL - platform_fee_amt - winner_allocation_amt;

    // 2. PLAYER SETUP
    let players = [];
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        players.push({
            id: i,
            username: i === 1 ? 'MainPlayer' : `Bot_${i}`,
            tokens: 0,
            squad_id: Math.ceil(i / 4),
            status: 'ALIVE',
            payouts: { winner: 0, performance: 0, squad: 0, refund: 0 }
        });
    }

    // 3. TOURNAMENT SIMULATION (Summary for speed, maintaining logic)
    // Phase 1: Target 60
    players.forEach(p => p.tokens = Math.floor(Math.random() * 70) + 10);
    players.forEach(p => { if (p.tokens < 40) p.status = 'ELIMINATED'; });

    // Phase 2: Rank Bottom 60%
    let aliveP2 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    aliveP2.slice(aliveP2.length - Math.floor(aliveP2.length * 0.6)).forEach(p => p.status = 'ELIMINATED');

    // Phase 3: Rank Bottom 70%
    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 50));
    let aliveP3 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    aliveP3.slice(aliveP3.length - Math.floor(aliveP3.length * 0.7)).forEach(p => p.status = 'ELIMINATED');

    // Phase 4: Championship
    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 50));
    const finalists = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);

    // 4. THE 5/10 SPLIT LOGIC (GLOBAL SUB-SESSION RANKING)
    const globalRanking = [...players].sort((a,b) => b.tokens - a.tokens);
    
    // Top 5% Group (Ranks 1-5)
    const top5Group = globalRanking.slice(0, 5);
    // Next 10% Group (Ranks 6-15) - The "Bottom 10% of the 15%"
    const refundGroup = globalRanking.slice(5, 15);

    // EXECUTE REFUNDS (Group B: Ranks 6-15)
    let total_refund_paid = 0;
    refundGroup.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        p.payout_lock = 'REFUND_ONLY'; // Locked out of Performance/Squad pools
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;

    // 5. POOL SPLIT (60% TOP PERFORMERS / 40% SQUAD POOL)
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool = net_survivor_pool * 0.40;

    // Top Performer Allocation (ONLY for Top 5% who are ALIVE)
    const aliveTop5 = top5Group.filter(p => p.status === 'ALIVE');
    const top5TokensTotal = aliveTop5.reduce((acc, p) => acc + p.tokens, 0);
    aliveTop5.forEach(p => {
        p.payouts.performance = (p.tokens / top5TokensTotal) * top_performer_pool;
    });

    // Squad Pool Allocation (All survivors EXCEPT Refund Group)
    const squadEligibleSurvivors = finalists.filter(p => p.payout_lock !== 'REFUND_ONLY');
    squadEligibleSurvivors.forEach(p => {
        p.payouts.squad = squad_pool / squadEligibleSurvivors.length;
    });

    // Rank 1 Winner Allocation
    if (finalists.length > 0 && finalists[0] === globalRanking[0]) {
        finalists[0].payouts.winner = winner_allocation_amt;
    }

    // 6. OUTPUT
    console.log(`\n[5/10 SPLIT ECONOMY CONFIGURATION]`);
    console.log(`- Platform Fee (${(platform_share_pct*100).toFixed(1)}%): $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Winner Allocation (${(winner_share_pct*100).toFixed(1)}%): $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Initial Survivor Pool: $${initial_survivor_pool.toFixed(2)}`);
    console.log(`- Refund Deduction (10 players): $${total_refund_paid.toFixed(2)}`);
    console.log(`- Net Survivor Pool: $${net_survivor_pool.toFixed(2)}`);

    console.log(`\n[GROUP B: REFUND ONLY (Ranks 6-15)]`);
    refundGroup.forEach((p, i) => {
        console.log(`- Rank ${i+6}: ${p.username} | Refund: $${p.payouts.refund.toFixed(2)} | Status: ${p.status}`);
    });

    console.log(`\n[GROUP A: PERFORMANCE ELIGIBLE (Ranks 1-5)]`);
    top5Group.forEach((p, i) => {
        console.log(`- Rank ${i+1}: ${p.username} | Status: ${p.status} | Perf Payout: $${p.payouts.performance.toFixed(2)}`);
    });

    console.log(`\n[FINAL SURVIVOR LEADERBOARD]`);
    finalists.forEach((p, i) => {
        const globalRank = globalRanking.indexOf(p) + 1;
        const total = p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund;
        console.log(`${i+1}. ${p.username} [Rank ${globalRank}] | Tokens: ${p.tokens} | Payout: $${total.toFixed(2)} (W:$${p.payouts.winner.toFixed(2)}, P:$${p.payouts.performance.toFixed(2)}, S:$${p.payouts.squad.toFixed(2)}, R:$${p.payouts.refund.toFixed(2)})`);
    });

    console.log('\n--- SIMULATION COMPLETE ---');
}

runSplitTierSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
