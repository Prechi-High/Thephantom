
/**
 * THE PHANTOM V5 MVP1 – CORRECTED VALIDATION REPORT
 * Role: Senior Game Economist, Tournament Simulator, Behavioral Systems Auditor
 */

const TOTAL_PLAYERS = 100;
const SQUAD_SIZE = 5;
const ENTRY_FEE = 5;
const TOTAL_POOL = TOTAL_PLAYERS * ENTRY_FEE;

type Player = {
    id: number;
    username: string;
    squadId: number;
    tokens: number;
    status: 'ALIVE' | 'RESERVE' | 'ELIMINATED';
    shieldActive: boolean;
};

type Squad = {
    id: number;
    members: number[];
    reviveTokens: number;
};

class V5MVP1Simulation {
    players: Player[] = [];
    squads: Squad[] = [];

    constructor() {
        for (let s = 1; s <= TOTAL_PLAYERS / SQUAD_SIZE; s++) {
            const memberIds = [];
            for (let p = 1; p <= SQUAD_SIZE; p++) {
                const id = (s - 1) * SQUAD_SIZE + p;
                this.players.push({
                    id,
                    username: `User_${id.toString().padStart(3, '0')}`,
                    squadId: s,
                    tokens: 0,
                    status: 'ALIVE',
                    shieldActive: false
                });
                memberIds.push(id);
            }
            this.squads.push({ id: s, members: memberIds, reviveTokens: 0 });
        }
    }

    run() {
        // PHASE 1
        this.simulateSpins(360, true);
        const p1Results = this.processPhase1();

        // PHASE 2
        this.simulateSpins(360, false);
        const p2Results = this.processPhase2();

        // PHASE 3
        this.simulateSpins(300, false);
        const p3Results = this.processPhase3();

        // PHASE 4
        this.simulateSpins(180, false);
        const p4Results = this.processPhase4();

        // ECONOMY
        this.executeEconomy(p1Results, p2Results, p3Results, p4Results);
    }

    simulateSpins(durationSeconds: number, canGenerateRevive: boolean) {
        const spins = Math.floor(durationSeconds / 8);
        for (let i = 0; i < spins; i++) {
            const alive = this.players.filter(p => p.status === 'ALIVE');
            alive.forEach(p => {
                const roll = Math.random();
                if (roll < 0.35) p.tokens += 1;
                else if (roll < 0.55) p.tokens += 0.5;
                else if (roll < 0.75) p.tokens += 2;
                else if (roll < 0.85) p.shieldActive = true;
                else {
                    const squad = this.squads.find(s => s.id === p.squadId)!;
                    const othersCount = squad.members.length - 1;
                    const stealPower = 1 + othersCount;
                    const targets = alive.filter(t => t.squadId !== p.squadId);
                    if (targets.length > 0) {
                        const target = targets[Math.floor(Math.random() * targets.length)]!;
                        if (target.shieldActive) {
                            target.shieldActive = false;
                        } else {
                            const amount = Math.min(target.tokens, stealPower);
                            target.tokens -= amount;
                            p.tokens += amount;
                        }
                    }
                }
                if (canGenerateRevive && Math.random() < 0.20) {
                    this.squads.find(s => s.id === p.squadId)!.reviveTokens += 1;
                }
            });
        }
    }

    processPhase1() {
        const catA = this.players.filter(p => p.tokens >= 60);
        const catB = this.players.filter(p => p.tokens >= 40 && p.tokens < 60);
        const catC = this.players.filter(p => p.tokens < 40);
        catA.forEach(p => p.status = 'ALIVE');
        catB.forEach(p => p.status = 'RESERVE');
        catC.forEach(p => p.status = 'ELIMINATED');

        let revivedCount = 0;
        this.squads.forEach(s => {
            const reservePlayers = this.players.filter(p => p.squadId === s.id && p.status === 'RESERVE');
            while (s.reviveTokens >= 3 && reservePlayers.length > 0) {
                const p = reservePlayers.pop()!;
                p.status = 'ALIVE';
                s.reviveTokens -= 3;
                revivedCount++;
            }
        });
        const notRevived = this.players.filter(p => p.status === 'RESERVE');
        notRevived.forEach(p => p.status = 'ELIMINATED');

        return { catA, catB, catC, revivedCount, notRevived };
    }

    processPhase2() {
        const alive = this.players.filter(p => p.status === 'ALIVE').sort((a, b) => b.tokens - a.tokens);
        const elimCount = Math.floor(alive.length * 0.60);
        const survivingCount = alive.length - elimCount;
        const eliminated = alive.slice(survivingCount);
        eliminated.forEach(p => p.status = 'ELIMINATED');
        return { alive, eliminated, survivingCount };
    }

    processPhase3() {
        const alive = this.players.filter(p => p.status === 'ALIVE').sort((a, b) => b.tokens - a.tokens);
        const elimCount = Math.floor(alive.length * 0.70);
        const survivingCount = alive.length - elimCount;
        const eliminated = alive.slice(survivingCount);
        eliminated.forEach(p => p.status = 'ELIMINATED');
        return { alive, eliminated, survivingCount };
    }

    processPhase4() {
        const remaining = this.players.filter(p => p.status === 'ALIVE').sort((a, b) => b.tokens - a.tokens);
        return { remaining };
    }

    executeEconomy(p1: any, p2: any, p3: any, p4: any) {
        console.log('THE PHANTOM V5 MVP1 – CORRECTED FULL SESSION VALIDATION');
        console.log('\n=========================================================');
        console.log('1. FULL PHASE-BY-PHASE BREAKDOWN');
        console.log('=========================================================');

        console.log('\nPHASE 1 — TARGET PHASE');
        console.log('----------------------');
        console.log(`CATEGORY A (60+ Tokens): ${p1.catA.length} [PASSED]`);
        console.log(`CATEGORY B (40–59 Tokens): ${p1.catB.length} [REVIVABLE]`);
        console.log(`CATEGORY C (0–39 Tokens): ${p1.catC.length} [ELIMINATED]`);
        console.log(`* Number eligible for revive: ${p1.catB.length}`);
        console.log(`* Number revived: ${p1.revivedCount}`);
        console.log(`* Number eliminated (below 40 or not revived): ${p1.catC.length + p1.notRevived.length}`);
        console.log(`Final survivors entering Phase 2: ${this.players.filter(p => p.status === 'ALIVE').length}`);

        console.log('\nPHASE 2 — RANK ELIMINATION');
        console.log('--------------------------');
        console.log(`* Cutoff token score: ${p2.alive[p2.survivingCount-1]?.tokens.toFixed(1) || 'N/A'}`);
        console.log(`* Survivors: ${p2.survivingCount}`);
        console.log(`* Eliminated: ${p2.eliminated.length}`);

        console.log('\nPHASE 3 — RANK ELIMINATION');
        console.log('--------------------------');
        console.log(`* Cutoff score: ${p3.alive[p3.survivingCount-1]?.tokens.toFixed(1) || 'N/A'}`);
        console.log(`* Survivors: ${p3.survivingCount}`);
        console.log(`* Eliminated: ${p3.eliminated.length}`);

        console.log('\nPHASE 4 — CHAMPIONSHIP');
        console.log('----------------------');
        console.log(`Final surviving count: ${p4.remaining.length}`);

        // ECONOMY START
        const platformFeePct = (Math.floor(Math.random() * 11) + 15) / 100;
        const winnerAllocPct = (Math.floor(Math.random() * 16) + 20) / 100;
        const platformFeeAmt = TOTAL_POOL * platformFeePct;
        const winnerBasePayout = TOTAL_POOL * winnerAllocPct;
        const initialRemainingPool = TOTAL_POOL - platformFeeAmt - winnerBasePayout;

        const sortedAll = [...this.players].sort((a, b) => b.tokens - a.tokens);
        const winner = sortedAll[0];
        const rewardTierParticipants = sortedAll.slice(1, 16); // Next 15

        // Correction 4: Refund Tier (Next 10)
        const refundTierCount = 10;
        const refundTotal = refundTierCount * ENTRY_FEE;
        const netRewardPool = initialRemainingPool - refundTotal;

        const topPerformerPool = netRewardPool * 0.60;
        const winnerSquadPool = netRewardPool * 0.40;

        // Top Performer Pool (Winner + next 5 = Top 6)
        const topPerformers = sortedAll.slice(0, 6);
        const totalTopPerformerTokens = topPerformers.reduce((sum, p) => sum + p.tokens, 0);

        // Winner Squad Pool (Winner Excluded)
        const winnerSquadmates = this.players.filter(p => p.squadId === winner!.squadId && p.id !== winner!.id);
        const totalWinnerSquadTokens = winnerSquadmates.reduce((sum, p) => sum + p.tokens, 0);

        console.log('\n=========================================================');
        console.log('SECTION A: WINNER');
        console.log('=========================================================');
        const winnerPerfShare = (winner!.tokens / totalTopPerformerTokens) * topPerformerPool;
        const winnerTotal = winnerBasePayout + winnerPerfShare;
        console.log(`Username: ${winner!.username}`);
        console.log(`Tokens: ${winner!.tokens.toFixed(1)}`);
        console.log(`Winner Allocation: $${winnerBasePayout.toFixed(2)}`);
        console.log(`Performance Allocation: $${winnerPerfShare.toFixed(2)}`);
        console.log(`Total Payout: $${winnerTotal.toFixed(2)}`);

        console.log('\n=========================================================');
        console.log('SECTION B: TOP 15 REWARDED PLAYERS (Winner Excluded)');
        console.log('=========================================================');
        console.log('Rank | Username | Tokens | Category | Payout Calculation | Total Payout');
        console.log('-------------------------------------------------------------------------');
        
        let totalRewardTierPayouts = 0;
        rewardTierParticipants.forEach((p, i) => {
            const rank = i + 2;
            const isPerfTier = rank <= 6;
            const category = isPerfTier ? 'Top 5 Reward Tier' : 'Refund Tier';
            
            let perfShare = 0;
            if (isPerfTier) {
                perfShare = (p.tokens / totalTopPerformerTokens) * topPerformerPool;
            }
            
            const refund = !isPerfTier ? ENTRY_FEE : 0;
            
            // Correction: Squad pool for anyone in winner squad
            let squadShare = 0;
            if (p.squadId === winner!.squadId) {
                squadShare = (p.tokens / (totalWinnerSquadTokens || 1)) * winnerSquadPool;
            }
            
            const total = perfShare + refund + squadShare;
            totalRewardTierPayouts += total;

            let calcStr = '';
            if (isPerfTier) calcStr = `Perf: $${perfShare.toFixed(2)}`;
            else calcStr = `Refund: $${refund.toFixed(2)}`;
            if (squadShare > 0) calcStr += ` + Squad: $${squadShare.toFixed(2)}`;

            console.log(`${rank.toString().padEnd(4)} | ${p.username.padEnd(8)} | ${p.tokens.toFixed(1).padStart(6)} | ${category.padEnd(17)} | ${calcStr.padEnd(20)} | $${total.toFixed(2)}`);
        });

        console.log('\n=========================================================');
        console.log('SECTION C: WINNER SQUAD REWARD BREAKDOWN (Winner Excluded)');
        console.log('=========================================================');
        let totalSquadmatePayouts = 0;
        winnerSquadmates.forEach(p => {
            const pct = (p.tokens / (totalWinnerSquadTokens || 1) * 100).toFixed(2);
            const share = (p.tokens / (totalWinnerSquadTokens || 1)) * winnerSquadPool;
            totalSquadmatePayouts += share;
            console.log(`Username: ${p.username.padEnd(8)} | Tokens: ${p.tokens.toFixed(1).padEnd(6)} | Token %: ${pct.padStart(6)}% | Squad Allocation: $${share.toFixed(2)}`);
        });

        console.log('\n=========================================================');
        console.log('2. COMPLETE ECONOMY AUDIT');
        console.log('=========================================================');
        console.log(`Initial Pool: $${TOTAL_POOL.toFixed(2)}`);
        console.log(`(-) Platform Fee: $${platformFeeAmt.toFixed(2)} (${(platformFeePct * 100).toFixed(0)}%)`);
        console.log(`(-) Winner Allocation: $${winnerBasePayout.toFixed(2)} (${(winnerAllocPct * 100).toFixed(0)}%)`);
        console.log(`(-) Refund Total (Next 10): $${refundTotal.toFixed(2)}`);
        console.log(`(-) Top Performer Pool (60% of Net): $${topPerformerPool.toFixed(2)}`);
        console.log(`(-) Winner Squad Pool (40% of Net): $${winnerSquadPool.toFixed(2)}`);
        
        const sumOfAllPools = platformFeeAmt + winnerBasePayout + refundTotal + topPerformerPool + winnerSquadPool;
        console.log(`---------------------------------------------------------`);
        console.log(`Total Allocated to Pools: $${sumOfAllPools.toFixed(2)}`);
        console.log(`Reconciliation (Pools vs Total): ${Math.abs(sumOfAllPools - TOTAL_POOL) < 0.01 ? 'SUCCESS' : 'FAILED'}`);

        console.log('\n=========================================================');
        console.log('3. FULL RECONCILIATION PROVING EVERY DOLLAR');
        console.log('=========================================================');
        
        // Summing actual distributed amounts
        let totalDistributedToUsers = winnerTotal;
        
        // We already have totalRewardTierPayouts (Ranks 2-16)
        // But some squadmates might NOT be in Ranks 2-16.
        let extraSquadmatePayouts = 0;
        winnerSquadmates.forEach(m => {
            if (!rewardTierParticipants.find(t => t.id === m.id)) {
                const share = (m.tokens / (totalWinnerSquadTokens || 1)) * winnerSquadPool;
                extraSquadmatePayouts += share;
            }
        });

        const totalUserPayoutsFinal = winnerTotal + totalRewardTierPayouts + extraSquadmatePayouts;
        const totalGrandFinal = totalUserPayoutsFinal + platformFeeAmt;

        console.log(`Distributed to Winner: $${winnerTotal.toFixed(2)}`);
        console.log(`Distributed to Top 15 (Ranks 2-16): $${totalRewardTierPayouts.toFixed(2)}`);
        console.log(`Distributed to Squadmates outside Top 16: $${extraSquadmatePayouts.toFixed(2)}`);
        console.log(`Platform Fee: $${platformFeeAmt.toFixed(2)}`);
        console.log(`---------------------------------------------------------`);
        console.log(`Grand Total: $${totalGrandFinal.toFixed(2)}`);
        console.log(`Original Pool: $${TOTAL_POOL.toFixed(2)}`);
        console.log(`Final Reconciliation: ${Math.abs(totalGrandFinal - TOTAL_POOL) < 0.01 ? 'SUCCESS' : 'FAILED'}`);
        console.log(`System Balanced: ${Math.abs(totalGrandFinal - TOTAL_POOL) < 0.01 ? 'YES' : 'NO'}`);
    }
}

new V5MVP1Simulation().run();
