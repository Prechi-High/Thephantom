const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runComprehensiveRecipientSimulation() {
    console.log('--- THE PHANTOM V4: FULL RECIPIENT LEADERBOARD SIMULATION ---');

    // 1. SESSION INITIALIZATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    // RANDOM ECONOMY GENERATION (Fixed for this specific audit)
    const platform_share_pct = 0.20; // 20%
    const winner_share_pct = 0.25;   // 25%
    
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
            status: 'ALIVE',
            payouts: { winner: 0, performance: 0, squad: 0, refund: 0 }
        });
    }

    // 3. TOURNAMENT SIMULATION
    // Phase 1-4: Random token accumulation and eliminations
    players.forEach(p => p.tokens = Math.floor(Math.random() * 200) + 10);
    // Simulate eliminations for roughly 80-90% of players
    players.forEach((p, idx) => {
        if (idx > 15 && Math.random() > 0.15) p.status = 'ELIMINATED';
    });

    // 4. GLOBAL RANKING & 5/10 SPLIT
    const globalRanking = [...players].sort((a,b) => b.tokens - a.tokens);
    const top5Group = globalRanking.slice(0, 5);
    const refundGroup = globalRanking.slice(5, 15);

    // EXECUTE REFUNDS (Group B: Ranks 6-15)
    let total_refund_paid = 0;
    refundGroup.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        p.payout_lock = 'REFUND_ONLY';
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;

    // 5. POOL SPLIT (60% TOP PERFORMERS / 40% SQUAD POOL)
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool = net_survivor_pool * 0.40;

    // Top Performer Allocation (Ranks 1-5 ONLY if ALIVE)
    const aliveTop5 = top5Group.filter(p => p.status === 'ALIVE');
    const top5TokensTotal = aliveTop5.reduce((acc, p) => acc + p.tokens, 0);
    aliveTop5.forEach(p => {
        p.payouts.performance = (p.tokens / top5TokensTotal) * top_performer_pool;
    });

    // Squad Pool Allocation (All survivors EXCEPT Refund Group)
    const finalists = players.filter(p => p.status === 'ALIVE');
    const squadEligibleSurvivors = finalists.filter(p => p.payout_lock !== 'REFUND_ONLY');
    squadEligibleSurvivors.forEach(p => {
        p.payouts.squad = squad_pool / squadEligibleSurvivors.length;
    });

    // Rank 1 Winner Allocation
    if (globalRanking[0].status === 'ALIVE') {
        globalRanking[0].payouts.winner = winner_allocation_amt;
    }

    // 6. COLLECT ALL RECIPIENTS
    const recipients = players.map(p => {
        p.total_payout = p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund;
        p.global_rank = globalRanking.indexOf(p) + 1;
        return p;
    }).filter(p => p.total_payout > 0).sort((a,b) => a.global_rank - b.global_rank);

    // 7. OUTPUT
    console.log(`\n[ECONOMY SUMMARY]`);
    console.log(`- Platform Fee: $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Winner Allocation: $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Initial Survivor Pool: $${initial_survivor_pool.toFixed(2)}`);
    console.log(`- Total Refunds Issued: $${total_refund_paid.toFixed(2)}`);
    console.log(`- Net Survivor Pool Shared: $${net_survivor_pool.toFixed(2)}`);

    console.log(`\n[FULL RECIPIENT LEADERBOARD]`);
    console.log(`RANK | USERNAME | STATUS | TOKENS | TOTAL PAYOUT | BREAKDOWN`);
    console.log(`--------------------------------------------------------------------------------`);
    recipients.forEach(p => {
        const breakdown = `(W:$${p.payouts.winner.toFixed(2)}, P:$${p.payouts.performance.toFixed(2)}, S:$${p.payouts.squad.toFixed(2)}, R:$${p.payouts.refund.toFixed(2)})`;
        console.log(`${p.global_rank.toString().padEnd(4)} | ${p.username.padEnd(12)} | ${p.status.padEnd(10)} | ${p.tokens.toString().padEnd(6)} | $${p.total_payout.toFixed(2).padEnd(12)} | ${breakdown}`);
    });

    console.log(`\n- Total Recipients: ${recipients.length}`);
    console.log('\n--- SIMULATION COMPLETE ---');
}

runComprehensiveRecipientSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
