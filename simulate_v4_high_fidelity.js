const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runHighFidelitySimulation() {
    console.log('--- THE PHANTOM V4: HIGH-FIDELITY ENGINE SIMULATION ---');

    // 1. SESSION INITIALIZATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    // ECONOMY CONFIGURATION
    const platform_share_pct = (Math.floor(Math.random() * 11) + 15) / 100; // 15-25%
    const winner_share_pct = (Math.floor(Math.random() * 16) + 20) / 100;   // 20-35%
    
    const platform_fee_amt = TOTAL_POOL * platform_share_pct;
    const winner_allocation_amt = TOTAL_POOL * winner_share_pct;
    const initial_survivor_pool = TOTAL_POOL - platform_fee_amt - winner_allocation_amt;

    // 2. PLAYER & SQUAD SETUP
    let players = [];
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        players.push({
            id: i,
            username: i === 1 ? 'MainPlayer' : `Bot_${i}`,
            tokens: 0,
            squad_id: Math.ceil(i / 4),
            status: 'ALIVE', // Current status
            phase1_tier: '',
            payouts: { winner: 0, performance: 0, squad: 0, refund: 0 }
        });
    }

    let squads = [];
    for (let i = 1; i <= 25; i++) {
        squads.push({ id: i, squad_tokens: 0 });
    }

    // 3. PHASE 1: TARGET SYSTEM
    console.log(`\n[PHASE 1: TARGET SYSTEM]`);
    players.forEach(p => {
        p.tokens = Math.floor(Math.random() * 60) + 20; // Generate 20-80 tokens
        // Squad tokens generation
        if (Math.random() > 0.7) squads.find(s => s.id === p.squad_id).squad_tokens += 1;
    });

    players.forEach(p => {
        if (p.tokens >= 60) p.phase1_tier = 'ADVANCE';
        else if (p.tokens >= 40) p.phase1_tier = 'RESERVE_ELIGIBLE';
        else p.phase1_tier = 'ELIMINATED';
    });

    // Revive Logic
    let revives_count = 0;
    squads.forEach(s => {
        let eligible = players.filter(p => p.squad_id === s.id && p.phase1_tier === 'RESERVE_ELIGIBLE');
        while (s.squad_tokens >= 3 && eligible.length > 0) {
            let p = eligible.shift();
            s.squad_tokens -= 3;
            p.status = 'ALIVE';
            revives_count++;
        }
    });

    players.forEach(p => {
        if (p.phase1_tier === 'ADVANCE') p.status = 'ALIVE';
        else if (p.status !== 'ALIVE') p.status = 'ELIMINATED';
    });

    console.log(`- Tier A (Advance): ${players.filter(p => p.phase1_tier === 'ADVANCE').length}`);
    console.log(`- Tier B (Reserve): ${players.filter(p => p.phase1_tier === 'RESERVE_ELIGIBLE').length}`);
    console.log(`- Tier C (Eliminated): ${players.filter(p => p.phase1_tier === 'ELIMINATED').length}`);
    console.log(`- Squad Revives Executed: ${revives_count}`);
    console.log(`- Total P1 Survivors: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 4. PHASE 2: RANK ELIMINATION (Bottom 60%)
    console.log(`\n[PHASE 2: RANK ELIMINATION]`);
    let survivorsP2 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    let elimCountP2 = Math.floor(survivorsP2.length * 0.60);
    survivorsP2.slice(survivorsP2.length - elimCountP2).forEach(p => p.status = 'ELIMINATED');
    console.log(`- Eliminated bottom 60%: ${elimCountP2}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 5. PHASE 3: RANK ELIMINATION (Bottom 70%)
    console.log(`\n[PHASE 3: RANK ELIMINATION]`);
    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 50));
    let survivorsP3 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    let elimCountP3 = Math.floor(survivorsP3.length * 0.70);
    survivorsP3.slice(survivorsP3.length - elimCountP3).forEach(p => p.status = 'ELIMINATED');
    console.log(`- Eliminated bottom 70%: ${elimCountP3}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 6. PHASE 4: CHAMPIONSHIP
    console.log(`\n[PHASE 4: CHAMPIONSHIP]`);
    players.filter(p => p.status === 'ALIVE').forEach(p => p.tokens += Math.floor(Math.random() * 40));
    const final_survivors = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.tokens - a.tokens);
    console.log(`- Final Championship Finalists: ${final_survivors.length}`);

    // 7. ECONOMY BREAKDOWN
    console.log(`\n[ECONOMY BREAKDOWN]`);
    console.log(`- Total Pool: $${TOTAL_POOL}`);
    console.log(`- Step 1: Platform Fee (${(platform_share_pct*100).toFixed(1)}%): $${platform_fee_amt.toFixed(2)}`);
    console.log(`- Step 2: Winner Allocation (${(winner_share_pct*100).toFixed(1)}%): $${winner_allocation_amt.toFixed(2)}`);
    console.log(`- Step 3: Initial Survivor Pool: $${initial_survivor_pool.toFixed(2)}`);

    // 8. REFUND LOGIC
    const top15Count = Math.max(1, Math.ceil(final_survivors.length * 0.15));
    const top15Group = final_survivors.slice(0, top15Count);
    const refundCount = Math.max(1, Math.floor(top15Group.length * 0.10));
    const refundList = top15Group.slice(top15Group.length - refundCount);
    
    let total_refund_paid = 0;
    refundList.forEach(p => {
        p.payouts.refund = ENTRY_FEE;
        total_refund_paid += ENTRY_FEE;
    });

    const net_survivor_pool = initial_survivor_pool - total_refund_paid;
    console.log(`\n[REFUND LIST]`);
    if (refundList.length > 0) {
        refundList.forEach(p => console.log(`- Refund Issued: ${p.username} ($${ENTRY_FEE})`));
    } else { console.log('- No refunds issued.'); }
    console.log(`- Net Survivor Pool after Refunds: $${net_survivor_pool.toFixed(2)}`);

    // 9. FINAL POOL SPLIT (60/40)
    const top_performer_pool = net_survivor_pool * 0.60;
    const squad_pool = net_survivor_pool * 0.40;

    // Distribute Top Performer (Weighted)
    const total_survivor_tokens = final_survivors.reduce((acc, p) => acc + p.tokens, 0);
    final_survivors.forEach(p => {
        p.payouts.performance = (p.tokens / total_survivor_tokens) * top_performer_pool;
        p.payouts.squad = squad_pool / final_survivors.length; // Simplified squad share for sim
    });

    // Award Winner Allocation
    if (final_survivors.length > 0) final_survivors[0].payouts.winner = winner_allocation_amt;

    console.log(`\n[TOP PERFORMER PAYOUT LIST]`);
    final_survivors.forEach(p => console.log(`- ${p.username}: $${p.payouts.performance.toFixed(2)}`));

    console.log(`\n[SQUAD POOL PAYOUT LIST]`);
    final_survivors.forEach(p => console.log(`- ${p.username}: $${p.payouts.squad.toFixed(2)}`));

    console.log(`\n[FINAL LEADERBOARD]`);
    final_survivors.forEach((p, i) => {
        const totalPayout = p.payouts.winner + p.payouts.performance + p.payouts.squad + p.payouts.refund;
        console.log(`${i+1}. ${p.username} | ${p.tokens} Tokens | Payout: $${totalPayout.toFixed(2)} (W: $${p.payouts.winner.toFixed(2)}, P: $${p.payouts.performance.toFixed(2)}, S: $${p.payouts.squad.toFixed(2)}, R: $${p.payouts.refund.toFixed(2)})`);
    });

    console.log('\n--- SIMULATION COMPLETE ---');
}

runHighFidelitySimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
