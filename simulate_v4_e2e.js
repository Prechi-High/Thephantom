const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runEndToEndSimulation() {
    console.log('--- THE PHANTOM V4: END-TO-END SYSTEM VALIDATION ---');

    // 1. CONFIGURATION & ECONOMY GENERATION
    const TOTAL_PLAYERS = 100;
    const ENTRY_FEE = 5;
    const PRIZE_POOL = TOTAL_PLAYERS * ENTRY_FEE;

    let platform_share_pct = (Math.floor(Math.random() * 11) + 15) / 100; // 15-25%
    let winner_share_pct = (Math.floor(Math.random() * 16) + 20) / 100;   // 20-35%
    if (platform_share_pct + winner_share_pct > 0.60) winner_share_pct = 0.60 - platform_share_pct;

    const platform_amt = PRIZE_POOL * platform_share_pct;
    const winner_amt = PRIZE_POOL * winner_share_pct;
    const initial_survivor_pool = PRIZE_POOL - platform_amt - winner_amt;

    console.log(`\n[ECONOMY GENERATED]`);
    console.log(`- Platform Share: ${(platform_share_pct * 100).toFixed(1)}% ($${platform_amt.toFixed(2)})`);
    console.log(`- Winner Share: ${(winner_share_pct * 100).toFixed(1)}% ($${winner_amt.toFixed(2)})`);
    console.log(`- Survivor Pool: $${initial_survivor_pool.toFixed(2)}`);

    // 2. PLAYER & SQUAD INITIALIZATION
    let players = [];
    for (let i = 1; i <= TOTAL_PLAYERS; i++) {
        players.push({
            id: i,
            username: i === 1 ? 'MainPlayer (Real)' : `Bot_${i}`,
            isBot: i !== 1,
            session_tokens: 0,
            squad_id: Math.ceil(i / 4),
            isRegisteredSquad: i <= 40,
            status: 'ALIVE',
            squad_tokens: 0,
            isRefunded: false
        });
    }

    let squads = [];
    for (let i = 1; i <= 25; i++) {
        squads.push({ id: i, type: i <= 10 ? 'REGISTERED' : 'TEMP', revive_pool: 0 });
    }

    // 3. PHASE 1: TARGET-BASED (60 Tokens, Reserve < 20)
    console.log(`\n[PHASE 1: TARGET-BASED PLAY]`);
    for (let round = 1; round <= 3; round++) {
        players.forEach(p => {
            if (p.status !== 'ALIVE') return;
            const gain = Math.floor(Math.random() * 25) + 5; // Higher gain to reach 60
            p.session_tokens += gain;
            if (Math.random() > 0.7) {
                squads.find(s => s.id === p.squad_id).revive_pool += 1;
            }
        });
    }

    players.forEach(p => {
        if (p.session_tokens < 60) {
            p.status = p.session_tokens < 20 ? 'RESERVE_ELIGIBLE' : 'ELIMINATED';
        }
    });

    const reserveCount = players.filter(p => p.status === 'RESERVE_ELIGIBLE').length;
    const eliminatedP1 = players.filter(p => p.status === 'ELIMINATED').length;
    console.log(`- Reserve Pool Candidates (<20 tokens): ${reserveCount}`);
    console.log(`- Hard Eliminated (20-59 tokens): ${eliminatedP1}`);

    // Revive Usage
    let revivesUsed = 0;
    squads.forEach(s => {
        const eligible = players.filter(p => p.squad_id === s.id && p.status === 'RESERVE_ELIGIBLE');
        while (s.revive_pool >= 3 && eligible.length > 0) {
            const p = eligible.pop();
            s.revive_pool -= 3;
            p.status = 'ALIVE';
            revivesUsed++;
        }
    });
    players.filter(p => p.status === 'RESERVE_ELIGIBLE').forEach(p => p.status = 'ELIMINATED');
    console.log(`- Squad Revives Used: ${revivesUsed}`);
    console.log(`- Phase 1 Survivors: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 4. PHASE 2: RANK-BASED (Bottom 60%)
    console.log(`\n[PHASE 2: RANK-BASED ELIMINATION]`);
    players.filter(p => p.status === 'ALIVE').forEach(p => p.session_tokens += Math.floor(Math.random() * 30));
    let aliveP2 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
    let elimCountP2 = Math.floor(aliveP2.length * 0.60);
    aliveP2.slice(aliveP2.length - elimCountP2).forEach(p => p.status = 'ELIMINATED');
    console.log(`- Eliminated bottom 60%: ${elimCountP2}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 5. PHASE 3: RANK-BASED (Bottom 70% + High Weighting)
    console.log(`\n[PHASE 3: HIGH-COMPETITION ELIMINATION]`);
    players.filter(p => p.status === 'ALIVE').forEach(p => p.session_tokens += Math.floor(Math.random() * 50));
    let aliveP3 = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);
    let elimCountP3 = Math.floor(aliveP3.length * 0.70);
    aliveP3.slice(aliveP3.length - elimCountP3).forEach(p => p.status = 'ELIMINATED');
    console.log(`- Eliminated bottom 70%: ${elimCountP3}`);
    console.log(`- Survivors remaining: ${players.filter(p => p.status === 'ALIVE').length}`);

    // 6. PHASE 4: FINAL RANKING
    console.log(`\n[PHASE 4: FINAL RESOLUTION]`);
    players.filter(p => p.status === 'ALIVE').forEach(p => p.session_tokens += Math.floor(Math.random() * 40));
    const survivors = players.filter(p => p.status === 'ALIVE').sort((a,b) => b.session_tokens - a.session_tokens);

    // 7. ECONOMY DISTRIBUTION
    console.log(`\n[FINAL ECONOMY DISTRIBUTION]`);
    const top15PctCount = Math.max(1, Math.ceil(survivors.length * 0.15));
    const top15Tier = survivors.slice(0, top15PctCount);
    
    // Refund Logic
    const refundCount = Math.max(1, Math.floor(top15Tier.length * 0.10));
    const refundees = top15Tier.slice(top15Tier.length - refundCount);
    refundees.forEach(p => p.isRefunded = true);
    const totalRefundPaid = refundees.length * ENTRY_FEE;
    
    const final_survivor_pool = initial_survivor_pool - totalRefundPaid;
    const top_performer_pool = final_survivor_pool * 0.60;
    const squad_member_pool = final_survivor_pool * 0.40;

    console.log(`- Refund Issued to: ${refundees.map(p => p.username).join(', ')} ($${totalRefundPaid})`);
    console.log(`- Final Top Performer Pool: $${top_performer_pool.toFixed(2)}`);
    console.log(`- Final Squad Pool: $${squad_member_pool.toFixed(2)}`);

    // 8. FINAL LEADERBOARD
    console.log(`\n[FINAL LEADERBOARD]`);
    survivors.forEach((p, i) => {
        let payout = 0;
        if (i === 0) payout += winner_amt;
        const top5PctCount = Math.max(1, Math.ceil(survivors.length * 0.05));
        if (i < top5PctCount) payout += (top_performer_pool / top5PctCount);
        if (p.isRefunded) payout += ENTRY_FEE;

        console.log(`${i+1}. ${p.username} | ${p.session_tokens} Tokens | Payout: $${payout.toFixed(2)}`);
    });

    // 9. ANOMALIES & BALANCE RISKS
    console.log(`\n[ANOMALIES & BALANCE RISKS]`);
    if (survivors.length < 2) console.log(`- RISK: Too few survivors for competitive payout.`);
    if (revivesUsed === 0) console.log(`- BALANCE: Phase 1 target might be too easy or squad tokens too rare.`);
    const realUser = players[0];
    console.log(`- Real User Outcome: ${realUser.status} (${realUser.session_tokens} tokens)`);

    console.log('\n--- SIMULATION COMPLETE ---');
}

runEndToEndSimulation()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
