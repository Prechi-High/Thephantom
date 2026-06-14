import prisma from '../config/prisma';
import redis from '../config/redis';
import { SubSessionState } from '../types/game';

export class EliminationService {
  static async processPhaseElimination(subSessionId: string) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    if (!stateRaw) return;

    const state: SubSessionState = JSON.parse(stateRaw);
    const phase = state.currentPhase;

    if (phase === 1) {
      await this.processPhase1(state);
    } else if (phase === 2) {
      await this.processPhase2(state);
    } else if (phase === 3) {
      await this.processPhase3(state);
    }

    state.currentPhase++;
    await redis.set(stateKey, JSON.stringify(state));
    
    // Sync to DB
    for (const player of Object.values(state.players)) {
      await prisma.subSessionPlayer.update({
        where: {
          subSessionId_userId: {
            subSessionId,
            userId: player.userId,
          },
        },
        data: { 
          status: player.status === 'ELIMINATED' ? 'ELIMINATED' : 'ALIVE',
          tokens: player.tokens,
          progress: player.progress
        },
      });
    }
  }

  private static async processPhase1(state: SubSessionState) {
    const players = Object.values(state.players).filter(p => p.status !== 'ELIMINATED');

    for (const player of players) {
      if (player.tokens >= 60) {
        player.status = 'ALIVE'; // Advance
      } else if (player.tokens >= 40) {
        player.status = 'RESERVE';
      } else {
        player.status = 'ELIMINATED';
      }
    }

    // Revival Logic for RESERVE players
    const reservePlayers = players.filter(p => p.status === 'RESERVE');
    for (const player of reservePlayers) {
      if (player.squadId && state.squadTokens[player.squadId] >= 3) {
        state.squadTokens[player.squadId] -= 3;
        player.status = 'ALIVE'; // Revived
        await prisma.systemLog.create({
          data: {
            level: 'INFO',
            message: `Player ${player.username} revived using 3 squad tokens in Phase 1`,
            metadata: { userId: player.userId, squadId: player.squadId, subSessionId: state.id },
          },
        });
      } else {
        player.status = 'ELIMINATED';
      }
    }
  }

  private static async processPhase2(state: SubSessionState) {
    const alivePlayers = Object.values(state.players)
      .filter(p => p.status === 'ALIVE')
      .sort((a, b) => b.tokens - a.tokens);

    const elimCount = Math.floor(alivePlayers.length * 0.60);
    const toEliminate = alivePlayers.slice(alivePlayers.length - elimCount);

    for (const player of toEliminate) {
      player.status = 'ELIMINATED';
    }
  }

  private static async processPhase3(state: SubSessionState) {
    const alivePlayers = Object.values(state.players)
      .filter(p => p.status === 'ALIVE')
      .sort((a, b) => b.tokens - a.tokens);

    const elimCount = Math.floor(alivePlayers.length * 0.70);
    const toEliminate = alivePlayers.slice(alivePlayers.length - elimCount);

    for (const player of toEliminate) {
      player.status = 'ELIMINATED';
    }
  }
}
