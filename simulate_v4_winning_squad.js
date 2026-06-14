const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runWinningSquadStackingSimulation() {
    console.log('--- THE PHANTOM V4: WINNING SQUAD & STACKING LOGIC ---');

    // 1. SESSION INITIALIZATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    const platform_share_pct = 0.20;
    const winner_share_pct = 0.25;
    
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
            squad_id: Math.ceil(i / 4), // 4 players per squad
            status: 'ALIVE',
            payouts: { winner: 0, performance: 0, squad: 0, refund: 0 },
            total_payout: 0,
            group: ''
        });
    }

    // 3. TOURNAMENT SIMULATION
    players.forEach(p => p.tokens = Math.floor(Math.random() * 200) + 10);
    // Standard eliminations
    players.forEach((p, idx) => {
        if (idx > 10 && Math.random() > 0.5) p.status = 'ELIMINATED';
    });

    // 4. GLOBAL RANKING & 5/10 SPLIT
    const globalRanking = [...players].sort((a,b) => b.tokens - a.tokens);
    const champion = globalRanking[0];
    const winning_squad_id = champion.squad_id;

    // Categorization
    const top5Group = globalRanking.slice(0, 5);
    const refundGroup = globalRanking.slice(5, 15);

    top5Group.forEach(p => p.group = 'PERFORMANCE');
    refundGroup.forEach(p => p.group = 'REFUND_ONLY');

    // 5. ECONOMY EXECUTION
    // A. Refunds (Ranks 6-15) - Flat $5
    let total_refund_paid = 0;
    refundGroup.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool_amt = net_survivor_pool * 0.40;

    // B. Winner Share (Champion ALIVE)
    if (champion.status === 'ALIVE') {
        champion.payouts.winner = winner_allocation_amt;
    }

    // C. Performance Pool (Top 5 ALIVE)
    const aliveTop5 = top5Group.filter(p => p.status === 'ALIVE');
    const top5TokensTotal = aliveTop5.reduce((acc, p) => acc + p.tokens, 0);
    aliveTop5.forEach(p => {
        p.payouts.performance = (p.tokens / top5TokensTotal) * top_performer_pool;
    });

    // D. WINNING SQUAD POOL (40%)
    // All members of the champion's squad (regardless of status)
    const winningSquadMembers = players.filter(p => p.squad_id === winning_squad_id);
    winningSquadMembers.forEach(p => {
        p.payouts.squad = squad_pool_amt / winningSquadMembers.length;
    });

    // 6. TOTAL PAYOUT & STACKING
    players.forEach(p => {
        p.total_payout = p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund;
        p.global_rank = globalRanking.indexOf(p) + 1;
    });

    const recipients = players.filter(p => p.total_payout > 0).sort((a,b) => a.global_rank - b.global_rank);

    // 7. OUTPUT
    console.log(`\n[ECONOMY MASTER LOG]`);
    console.log(`- Champion: ${champion.username} (Squad ID: ${winning_squad_id})`);
    console.log(`- Winning Squad Members: ${winningSquadMembers.map(p => p.username).join(', ')}`);
    console.log(`- Platform Fee: $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Winner Pot: $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Total Refunds Paid: $${total_refund_paid.toFixed(2)}`);
    console.log(`- Performance Pool: $${top_performer_pool.toFixed(2)}`);
    console.log(`- Winning Squad Pool: $${squad_pool_amt.toFixed(2)}`);

    console.log(`\n[FULL RECIPIENT LEADERBOARD (STACKING ENABLED)]`);
    console.log(`RANK | USERNAME | STATUS | TOKENS | TOTAL PAYOUT | BREAKDOWN`);
    console.log(`--------------------------------------------------------------------------------`);
    recipients.forEach(p => {
        const breakdown = `(W:$${p.payouts.winner.toFixed(2)}, P:$${p.payouts.performance.toFixed(2)}, S:$${p.payouts.squad.toFixed(2)}, R:$${p.payouts.refund.toFixed(2)})`;
        console.log(`${p.global_rank.toString().padEnd(4)} | ${p.username.padEnd(12)} | ${p.status.padEnd(10)} | ${p.tokens.toString().padEnd(6)} | $${p.total_payout.toFixed(2).padEnd(12)} | ${breakdown}`);
    });

    console.log(`\n[STACKING AUDIT]`);
    const stacked = recipients.filter(p => (p.payouts.refund > 0 && p.payouts.squad > 0) || (p.payouts.performance > 0 && p.payouts.squad > 0));
    if (stacked.length > 0) {
        stacked.forEach(p => console.log(`- STACKED PAYOUT: ${p.username} received both ${p.payouts.refund > 0 ? 'Refund' : 'Performance'} AND Squad Share.`));
    } else {
        console.log(`- No players occupied multiple categories in this run.`);
    }

    console.log(`\n- Total Recipients: ${recipients.length}`);
    console.log('\n--- SIMULATION COMPLETE ---');
}

runWinningSquadStackingSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
