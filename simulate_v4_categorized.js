const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCategorizedRecipientSimulation() {
    console.log('--- THE PHANTOM V4: CATEGORIZED RECIPIENT BREAKDOWN ---');

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
            status: 'ALIVE',
            payouts: { winner: 0, performance: 0, squad: 0, refund: 0 },
            group: ''
        });
    }

    // 3. TOURNAMENT SIMULATION
    players.forEach(p => p.tokens = Math.floor(Math.random() * 200) + 10);
    // Force some survivors and eliminations for a diverse leaderboard
    players.forEach((p, idx) => {
        if (idx > 10 && Math.random() > 0.3) p.status = 'ELIMINATED';
    });

    // 4. GLOBAL RANKING & 5/10 SPLIT
    const globalRanking = [...players].sort((a,b) => b.tokens - a.tokens);
    
    // Grouping
    const top5Group = globalRanking.slice(0, 5);
    const refundGroup = globalRanking.slice(5, 15);
    const squadOnlyGroup = globalRanking.slice(15);

    top5Group.forEach(p => p.group = 'PERFORMANCE');
    refundGroup.forEach(p => p.group = 'REFUND_ONLY');
    squadOnlyGroup.forEach(p => p.group = 'SQUAD_ONLY');

    // 5. ECONOMY EXECUTION
    // A. Refunds (Ranks 6-15) - Flat $5
    let total_refund_paid = 0;
    refundGroup.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool = net_survivor_pool * 0.40;

    // B. Winner Share (Rank 1 ALIVE)
    if (globalRanking[0].status === 'ALIVE') {
        globalRanking[0].payouts.winner = winner_allocation_amt;
    }

    // C. Performance Pool (Top 5 ALIVE)
    const aliveTop5 = top5Group.filter(p => p.status === 'ALIVE');
    const top5TokensTotal = aliveTop5.reduce((acc, p) => acc + p.tokens, 0);
    aliveTop5.forEach(p => {
        p.payouts.performance = (p.tokens / top5TokensTotal) * top_performer_pool;
    });

    // D. Squad Pool (Survivors EXCEPT Refund Group)
    const survivors = players.filter(p => p.status === 'ALIVE');
    const squadEligible = survivors.filter(p => p.group !== 'REFUND_ONLY');
    squadEligible.forEach(p => {
        p.payouts.squad = squad_pool / squadEligible.length;
    });

    // 6. OUTPUT
    console.log(`\n[ECONOMY MASTER LOG]`);
    console.log(`- Platform Fee: $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Winner Pot: $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Total Refunds Paid: $${total_refund_paid.toFixed(2)}`);
    console.log(`- Net Performance Pool (60%): $${top_performer_pool.toFixed(2)}`);
    console.log(`- Net Squad Pool (40%): $${squad_pool.toFixed(2)}`);

    const recipients = players.filter(p => (p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund) > 0);
    recipients.sort((a, b) => globalRanking.indexOf(a) - globalRanking.indexOf(b));

    console.log(`\n[RECIPIENT CATEGORY BREAKDOWN]`);
    
    console.log(`\nCATEGORY 1: THE CHAMPION (Rank 1)`);
    const champion = globalRanking[0];
    console.log(`- ${champion.username} | Status: ${champion.status} | Tokens: ${champion.tokens} | Payout: $${(champion.payouts.winner + champion.payouts.performance + champion.payouts.squad).toFixed(2)}`);

    console.log(`\nCATEGORY 2: TOP 5% PERFORMANCE GROUP (Ranks 1-5)`);
    top5Group.forEach((p, i) => {
        const total = p.payouts.performance + p.payouts.squad + p.payouts.winner;
        console.log(`- Rank ${i+1}: ${p.username} | Status: ${p.status} | Payout: $${total.toFixed(2)}`);
    });

    console.log(`\nCATEGORY 3: NEXT 10% REFUND GROUP (Ranks 6-15)`);
    refundGroup.forEach((p, i) => {
        console.log(`- Rank ${i+6}: ${p.username} | Status: ${p.status} | Refund Payout: $${p.payouts.refund.toFixed(2)} (Only)`);
    });

    console.log(`\nCATEGORY 4: SQUAD POOL SURVIVORS (Remaining)`);
    const otherSurvivors = survivors.filter(p => p.group === 'SQUAD_ONLY');
    otherSurvivors.forEach(p => {
        console.log(`- Rank ${globalRanking.indexOf(p)+1}: ${p.username} | Tokens: ${p.tokens} | Payout: $${p.payouts.squad.toFixed(2)}`);
    });

    console.log(`\n[RECIPIENT COUNT CALCULATION]`);
    console.log(`- Performance Group Members: 5`);
    console.log(`- Refund Group Members: 10`);
    console.log(`- Other Survivors (Squad Pool): ${otherSurvivors.length}`);
    console.log(`- Total Recipients: ${recipients.length}`);

    console.log('\n--- SIMULATION COMPLETE ---');
}

runCategorizedRecipientSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
