/**
 * THE PHANTOM V5 MVP1 - CORE SIMULATION ENGINE
 */

export const generatePlayers = (count = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    username: `User_${i.toString().padStart(3, '0')}`,
    squadId: `s${Math.floor(i / 5)}`, // 20 squads of 5
    tokens: 0,
    status: 'ACTIVE',
    category: null, // A, B, or C
    shieldActive: false,
    cloakActive: false,
    isReal: i === 0,
  }));
};

export const runPhase1Tick = (players) => {
  return players.map(p => {
    if (p.status !== 'ACTIVE') return p;

    let newTokens = p.tokens;
    const roll = Math.random();

    // Baseline Outcomes
    if (roll < 0.40) newTokens += 1.0;
    else if (roll < 0.60) newTokens += 0.5;
    else if (roll < 0.70) newTokens += 2.0; // Advance
    
    // Steal Impact Simulation (Zero-sum probability)
    if (Math.random() < 0.10) {
      const isTarget = Math.random() < 0.5;
      newTokens += isTarget ? -1.0 : 1.0;
    }

    return { ...p, tokens: Math.max(0, newTokens) };
  });
};

export const classifyPlayers = (players) => {
  return players.map(p => {
    let category = 'C'; // ELIMINATED (<= 39)
    if (p.tokens >= 60) category = 'A'; // PASS
    else if (p.tokens >= 40) category = 'B'; // REVIVABLE
    return { ...p, category };
  });
};
