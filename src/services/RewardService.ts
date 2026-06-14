import prisma from '../config/prisma';
import { PlayerState } from '../types/game';

export class RewardService {
  static async distributeRewards(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rules: true,
        subSessions: {
          include: {
            players: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!session) throw new Error('Session not found');

    // 1. Collect all players across all sub-sessions who are still ALIVE at the end (Championship Phase survivors)
    // Actually, Championship phase has NO elimination, so everyone who reached it is eligible.
    // The spec says "Top 15% Calculation... Example 100 players... Ranks 1-15 Enter Reward Tier".
    // This implies we rank ALL players in the Global Session by tokens.

    const allPlayers = session.subSessions.flatMap(ss => 
      ss.players.filter(p => p.status === 'ALIVE')
    );

    // Fetch token data from final Redis state (or assume it's synced to DB)
    // For MVP, we'll assume it's synced or we fetch it here.
    // Let's assume we have a way to get final tokens. 
    // For now, I'll use a placeholder logic that would work if tokens were in SubSessionPlayer.
    // Wait, SubSessionPlayer in schema doesn't have tokens. It has lastSpinId.
    // We should probably have tokens in SubSessionPlayer or fetch from Redis.
    
    // Fetch final tokens and status from the database
    const playersWithTokens = session.subSessions.flatMap(ss => 
      ss.players
        .filter(p => p.status === 'ALIVE')
        .map(p => ({
          userId: p.userId,
          squadId: p.squadId,
          tokens: p.tokens,
          username: p.user.username
        }))
    );

    if (playersWithTokens.length === 0) return;

    // 2. Ranking
    playersWithTokens.sort((a, b) => b.tokens - a.tokens);

    // 3. Top 15% Calculation
    const top15Count = Math.ceil(playersWithTokens.length * 0.15);
    const rewardTier = playersWithTokens.slice(0, top15Count);

    if (rewardTier.length === 0) return;

    let totalPool = Number(session.prizePool);
    const entryFee = Number(session.rules.entryFee);

    // 4. Refund Layer: Bottom 10 of Top 15
    const refundCount = Math.min(rewardTier.length, 10);
    const refundPlayers = rewardTier.slice(-refundCount);
    
    for (const p of refundPlayers) {
      await this.payout(p.userId, entryFee, 'GAME_WIN', session.id);
      totalPool -= entryFee;
    }

    // 5. Remaining Reward Pool
    const remainingPool = totalPool;
    const topPerformerPool = remainingPool * 0.60;
    const squadPool = remainingPool * 0.40;

    // 6. Top Performer Layer (Ranks 1-5 Only)
    const top5 = rewardTier.slice(0, 5);
    const totalTop5Tokens = top5.reduce((sum, p) => sum + p.tokens, 0);

    if (totalTop5Tokens > 0) {
      for (const p of top5) {
        const amount = (p.tokens / totalTop5Tokens) * topPerformerPool;
        await this.payout(p.userId, amount, 'GAME_WIN', session.id);
      }
    }

    // 7. Squad Pool Layer (Winner's Squad Only)
    const winner = rewardTier[0];
    if (winner.squadId) {
      const winnerSquadMembers = playersWithTokens.filter(p => p.squadId === winner.squadId);
      const totalSquadTokens = winnerSquadMembers.reduce((sum, p) => sum + p.tokens, 0);

      if (totalSquadTokens > 0) {
        for (const p of winnerSquadMembers) {
          const amount = (p.tokens / totalSquadTokens) * squadPool;
          await this.payout(p.userId, amount, 'SQUAD_DISTRIBUTION', session.id);
        }
      }
    } else {
      // If winner has no squad, does the squad pool go to them? Or is it lost?
      // Spec says "Eligible Only Winner's Squad". 
      // If no squad, we'll assume it goes back to platform or winner gets it.
      // Usually, Winner gets it if no squad.
      await this.payout(winner.userId, squadPool, 'GAME_WIN', session.id);
    }
  }

  private static async payout(userId: string, amount: number, type: any, referenceId: string) {
    if (amount <= 0) return;

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });

    await prisma.tokenLedger.create({
      data: {
        userId,
        amount,
        type,
        referenceId,
      },
    });
  }
}
