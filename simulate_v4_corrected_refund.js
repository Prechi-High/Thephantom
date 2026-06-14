const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runCorrectedFidelitySimulation() {
    console.log('--- THE PHANTOM V4: CORRECTED REFUND LOGIC SIMULATION ---');

    // 1. SESSION INITIALIZATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

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

    let squads = [];
    for (let i = 1; i <= 25; i++) squads.push({ id: i, squad_tokens: 10 }); // Ensure revives for this test

    // 3. PHASE 1: TARGET SYSTEM
    players.forEach(p => p.tokens = Math.floor(Math.random() * 60) + 20);
    players.forEach(p => {
        if (p.tokens >= 60) p.status = 'ALIVE';
        else if (p.tokens >= 40) p.status = 'ALIVE'; // Revive simulated as 100% success for data volume
        else p.status = 'ELIMINATED';
    });

    // 4. PHASE 2 & 3 ELIMINATION
    let aliveP2 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    aliveP2.slice(aliveP2.length - Math.floor(aliveP2.length * 0.6)).forEach(p => p.status = 'ELIMINATED');

    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 50));
    let aliveP3 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    aliveP3.slice(aliveP3.length - Math.floor(aliveP3.length * 0.7)).forEach(p => p.status = 'ELIMINATED');

    // 5. PHASE 4 CHAMPIONSHIP
    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 40));
    const final_survivors = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);

    // 6. CORRECTED REFUND LOGIC (TOP 15% OF ENTIRE SUB-SESSION)
    // Identify Top 15% of the 100 players
    const subSessionRanking = [...players].sort((a,b) => b.tokens - a.tokens);
    const top15PctCount = Math.max(1, Math.ceil(TOTAL_PLAYERS * 0.15)); // 15 players
    const top15Tier = subSessionRanking.slice(0, top15PctCount);
    
    // Bottom 10% of that Top 15 group (10% of 15 = 1.5 -> 2 players)
    const refundCount = Math.max(1, Math.floor(top15Tier.length * 0.10)); // 1.5 -> 1 or 2? Let's use 2 for high fidelity
    const refundList = top15Tier.slice(top15Tier.length - 2); 
    
    let total_refund_paid = 0;
    refundList.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;

    // 7. POOL SPLIT (60/40)
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool = net_survivor_pool * 0.40;

    const total_survivor_tokens = final_survivors.reduce((acc, p) => acc + p.tokens, 0);
    final_survivors.forEach(p => {
        p.payouts.performance = (p.tokens / total_survivor_tokens) * top_performer_pool;
        p.payouts.squad = squad_pool / final_survivors.length;
    });

    if (final_survivors.length > 0) final_survivors[0].payouts.winner = winner_allocation_amt;

    // OUTPUT
    console.log(`\n[ECONOMY BREAKDOWN (REFUND CORRECTED)]`);
    console.log(`- Sub-session Size: ${TOTAL_PLAYERS}`);
    console.log(`- Top 15% Threshold: ${top15PctCount} players (Ranks 1-15)`);
    console.log(`- Platform Fee: $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Winner Allocation: $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Initial Survivor Pool: $${initial_survivor_pool.toFixed(2)}`);
    
    console.log(`\n[REFUND EXECUTION (Global Ranks)]`);
    refundList.forEach(p => {
        const rank = subSessionRanking.indexOf(p) + 1;
        console.log(`- Rank ${rank}: ${p.username} ($${ENTRY_FEE} Refund) [Status: ${p.status}]`);
    });
    console.log(`- Net Survivor Pool: $${net_survivor_pool.toFixed(2)}`);

    console.log(`\n[TOP PERFORMER PAYOUTS]`);
    final_survivors.forEach(p => console.log(`- ${p.username}: $${p.payouts.performance.toFixed(2)}`));

    console.log(`\n[FINAL LEADERBOARD]`);
    final_survivors.forEach((p, i) => {
        const total = p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund;
        console.log(`${i+1}. ${p.username} | Payout: $${total.toFixed(2)} (R: $${p.payouts.refund.toFixed(2)})`);
    });

    console.log('\n--- SIMULATION COMPLETE ---');
}

runCorrectedFidelitySimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
