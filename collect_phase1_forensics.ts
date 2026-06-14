
/**
 * PHASE 1 TOKEN FORENSICS DATA COLLECTOR
 * Samples: 10,000 players (2,000 squads)
 */

const SAMPLES = 10000;
const SQUAD_SIZE = 5;
const SPINS = 45;
const REVIVE_COST = 3;

function simulatePlayer() {
    let sessionTokens = 0;
    let squadTokens = 0;
    
    for (let i = 0; i < SPINS; i++) {
        const roll = Math.random();
        if (roll < 0.35) sessionTokens += 1;
        else if (roll < 0.55) sessionTokens += 0.5;
        else if (roll < 0.75) sessionTokens += 2;
        // Steal (Net 0 expectation, assuming +/- 2.5 variance impact)
        // We'll simulate a random walk for steal outcomes: 15% chance of +/- 2.5 avg steal power
        if (roll >= 0.85) {
            const stealRoll = Math.random();
            if (stealRoll < 0.5) sessionTokens += 2.5; // Gain
            else sessionTokens -= 2.5; // Loss
        }

        if (Math.random() < 0.20) squadTokens += 1;
    }
    return { sessionTokens, squadTokens };
}

const players = [];
for (let i = 0; i < SAMPLES; i++) {
    players.push(simulatePlayer());
}

// Stats
const scores = players.map(p => p.sessionTokens).sort((a, b) => a - b);
const avg = scores.reduce((a, b) => a + b, 0) / SAMPLES;
const median = scores[SAMPLES / 2];
const highest = scores[SAMPLES - 1];
const lowest = scores[0];

const dist = {
    dead: players.filter(p => p.sessionTokens < 40).length,
    revivable: players.filter(p => p.sessionTokens >= 40 && p.sessionTokens < 60).length,
    passed: players.filter(p => p.sessionTokens >= 60).length
};

console.log('--- SESSION TOKEN STATS ---');
console.log(`Average: ${avg.toFixed(2)}`);
console.log(`Median: ${median?.toFixed(2) || 'N/A'}`);
console.log(`Highest: ${highest?.toFixed(2) || 'N/A'}`);
console.log(`Lowest: ${lowest?.toFixed(2) || 'N/A'}`);
console.log(`0-39 (Dead): ${dist.dead} (${(dist.dead/SAMPLES*100).toFixed(2)}%)`);
console.log(`40-59 (Revivable): ${dist.revivable} (${(dist.revivable/SAMPLES*100).toFixed(2)}%)`);
console.log(`60+ (Passed): ${dist.passed} (${(dist.passed/SAMPLES*100).toFixed(2)}%)`);

// Squad Token Stats
const squadTokens = [];
for (let i = 0; i < SAMPLES; i += SQUAD_SIZE) {
    const squadPlayers = players.slice(i, i + SQUAD_SIZE);
    const totalSquadTokens = squadPlayers.reduce((s, p) => s + p.squadTokens, 0);
    const survivors = squadPlayers.filter(p => p.sessionTokens >= 60).length;
    const revivable = squadPlayers.filter(p => p.sessionTokens >= 40 && p.sessionTokens < 60).length;
    squadTokens.push({ totalSquadTokens, survivors, revivable });
}

const avgSquadTokens = squadTokens.reduce((s, sq) => s + sq.totalSquadTokens, 0) / (SAMPLES / SQUAD_SIZE);
const zeroSurvivorSquads = squadTokens.filter(sq => sq.survivors === 0).length;

console.log('\n--- SQUAD TOKEN STATS ---');
console.log(`Average Squad Tokens: ${avgSquadTokens.toFixed(2)}`);
console.log(`Revive Capacity (Avg): ${(avgSquadTokens / REVIVE_COST).toFixed(2)} revives per squad`);
console.log(`Squads with ZERO survivors: ${zeroSurvivorSquads} (${(zeroSurvivorSquads / (SAMPLES/SQUAD_SIZE) * 100).toFixed(2)}%)`);
