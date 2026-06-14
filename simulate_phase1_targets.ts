
/**
 * PHASE 1 TARGET BALANCE RESEARCH
 * Samples: 10,000 players (2,000 squads) per target
 */

const SAMPLES = 10000;
const SQUAD_SIZE = 5;
const SPINS = 45;
const REVIVE_COST = 3;
const TARGETS = [40, 45, 50, 55, 60];

function simulatePlayer() {
    let sessionTokens = 0;
    let squadTokens = 0;
    
    for (let i = 0; i < SPINS; i++) {
        const roll = Math.random();
        // Probabilities from previous audit
        if (roll < 0.35) sessionTokens += 1.0;
        else if (roll < 0.55) sessionTokens += 0.5;
        else if (roll < 0.75) sessionTokens += 2.0;
        // Steal variance simulation (+/- 2.5 per steal event)
        else if (roll >= 0.85) {
            sessionTokens += (Math.random() < 0.5 ? 2.5 : -2.5);
        }

        if (Math.random() < 0.20) squadTokens += 1;
    }
    return { sessionTokens, squadTokens };
}

function runSimulation(target: number) {
    const players = [];
    for (let i = 0; i < SAMPLES; i++) {
        players.push(simulatePlayer());
    }

    const scores = players.map(p => p.sessionTokens).sort((a, b) => a - b);
    const avg = scores.reduce((a, b) => a + b, 0) / SAMPLES;
    const median = scores[Math.floor(SAMPLES / 2)];
    
    const passed = players.filter(p => p.sessionTokens >= target);
    const revivable = players.filter(p => p.sessionTokens >= 40 && p.sessionTokens < target);
    const dead = players.filter(p => p.sessionTokens < 40);

    const squads = [];
    let totalRevives = 0;
    let totalPhase2Entry = 0;

    for (let i = 0; i < SAMPLES; i += SQUAD_SIZE) {
        const squadPlayers = players.slice(i, i + SQUAD_SIZE);
        const squadTokenPool = squadPlayers.reduce((s, p) => s + p.squadTokens, 0);
        const survivors = squadPlayers.filter(p => p.sessionTokens >= target).length;
        const eligibleForRevive = squadPlayers.filter(p => p.sessionTokens >= 40 && p.sessionTokens < target);
        
        let revivesPerformed = 0;
        if (survivors > 0) {
            let currentPool = squadTokenPool;
            eligibleForRevive.forEach(() => {
                if (currentPool >= REVIVE_COST) {
                    currentPool -= REVIVE_COST;
                    revivesPerformed++;
                }
            });
        }
        
        totalRevives += revivesPerformed;
        totalPhase2Entry += (survivors + revivesPerformed);
        squads.push({ survivors });
    }

    const squadsWithSurvivor = squads.filter(s => s.survivors > 0).length;
    const stabilityScore = (totalPhase2Entry / SAMPLES) * (squadsWithSurvivor / (SAMPLES/SQUAD_SIZE)) * 100;

    return {
        target,
        avg,
        median,
        high: scores[SAMPLES - 1],
        low: scores[0],
        passedPct: (passed.length / SAMPLES) * 100,
        revivablePct: (revivable.length / SAMPLES) * 100,
        deadPct: (dead.length / SAMPLES) * 100,
        squadSurvivorPct: (squadsWithSurvivor / (SAMPLES / SQUAD_SIZE)) * 100,
        avgRevives: totalRevives / (SAMPLES / SQUAD_SIZE),
        avgPhase2Entry: totalPhase2Entry / (SAMPLES / SQUAD_SIZE),
        stabilityScore
    };
}

console.log('PHASE 1 TARGET BALANCE RESEARCH REPORT');
console.log('=====================================');
const results = TARGETS.map(t => runSimulation(t));

console.table(results.map(r => ({
    "Target": r.target,
    "Avg Score": r.avg.toFixed(2),
    "Pass%": r.passedPct.toFixed(1) + "%",
    "Revivable%": r.revivablePct.toFixed(1) + "%",
    "Dead%": r.deadPct.toFixed(1) + "%",
    "Squad Success%": r.squadSurvivorPct.toFixed(1) + "%",
    "Avg Revives": r.avgRevives.toFixed(2),
    "Phase 2 Count (Avg)": (r.avgPhase2Entry * 20).toFixed(1), // Normalized to 100 players
    "Stability": r.stabilityScore.toFixed(1)
})));
