/**
 * THE PHANTOM V5 MVP1 - ECONOMY RECONCILIATION ENGINE
 */

export const calculateEconomy = (players, config = { pool: 500, platformFee: 0.20, winnerAlloc: 0.25 }) => {
  const sorted = [...players].sort((a, b) => b.tokens - a.tokens);
  
  const platformFee = config.pool * config.platformFee;
  const winnerAllocation = config.pool * config.winnerAlloc;
  
  // Refund Tier: Ranks 6-15 overall (Next 10 excluding top 5)
  // For MVP1 we apply this to the top token holders below the winner
  const refundTierCount = 10;
  const refundTotal = refundTierCount * 5; // $5 refund per player
  
  const netPool = config.pool - platformFee - winnerAllocation - refundTotal;
  const performancePool = netPool * 0.60;
  const squadPool = netPool * 0.40;

  return {
    platformFee,
    winnerAllocation,
    refundTotal,
    performancePool,
    squadPool,
    totalDistributed: platformFee + winnerAllocation + refundTotal + performancePool + squadPool
  };
};
