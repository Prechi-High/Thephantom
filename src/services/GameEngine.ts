import redis from '../config/redis';
import prisma from '../config/prisma';
import { SubSessionState, PlayerState } from '../types/game';
import { ActionType } from '@prisma/client';

export class GameEngine {
  static async processSpin(subSessionId: string, userId: string, forcedAction?: ActionType) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    if (!stateRaw) throw new Error('Sub-session state not found');

    const state: SubSessionState = JSON.parse(stateRaw);
    const player = state.players[userId];

    if (!player || player.status !== 'ALIVE') {
      throw new Error('Player not eligible for spin');
    }

    // 1. Calculate Spin Result
    const action = forcedAction || this.getRandomAction();
    const result = this.calculateActionResult(action, player, state);

    // 2. Update State
    this.applyResult(state, userId, action, result);
    state.lastUpdate = Date.now();

    // 3. Save back to Redis
    await redis.set(stateKey, JSON.stringify(state));

    // 4. Async: Record in DB (Ledger & Spin logs)
    // In a production system, this would be a BullMQ job
    await this.logSpinToDb(subSessionId, userId, action, result);

    return { action, result, newState: state };
  }

  private static getRandomAction(): ActionType {
    const actions: ActionType[] = ['ADVANCE', 'STEAL', 'SHIELD', 'REVIVE', 'TOKEN'];
    // Simple uniform distribution for MVP; can be weighted later
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private static calculateActionResult(action: ActionType, player: PlayerState, state: SubSessionState) {
    switch (action) {
      case 'ADVANCE':
        return { steps: Math.floor(Math.random() * 10) + 1 };
      case 'TOKEN':
        return { amount: Math.floor(Math.random() * 50) + 10 };
      case 'STEAL':
        // Find a random target who is ALIVE, not the current player, and NOT shielded or cloaked
        const targets = Object.values(state.players).filter(p => 
          p.userId !== player.userId && 
          p.status === 'ALIVE' && 
          (!p.buffs || p.buffs.shieldSpins <= 0) &&
          (!p.buffs || p.buffs.cloakSpins <= 0)
        );
        if (targets.length === 0) return { amount: 0, targetId: null, blocked: true };
        const target = targets[Math.floor(Math.random() * targets.length)];
        return { amount: Math.floor(Math.random() * 30) + 5, targetId: target.userId };
      case 'SHIELD':
        return { active: true, duration: 3 }; // 3 spins
      case 'REVIVE':
        return { granted: true };
      default:
        return {};
    }
  }

  private static applyResult(state: SubSessionState, userId: string, action: ActionType, result: any) {
    const player = state.players[userId];
    
    // Squad Token Generation (20% chance)
    if (player.squadId && Math.random() < 0.2) {
      state.squadTokens[player.squadId] = (state.squadTokens[player.squadId] || 0) + 1;
    }

    // Decrement buffs on every spin
    if (player.buffs) {
      if (player.buffs.shieldSpins > 0) player.buffs.shieldSpins--;
      if (player.buffs.cloakSpins > 0) player.buffs.cloakSpins--;
    } else {
      player.buffs = { shieldSpins: 0, cloakSpins: 0, hasInsurance: false, hasRevive: false };
    }

    if (action === 'ADVANCE') {
      player.progress += result.steps;
    } else if (action === 'TOKEN') {
      player.tokens += result.amount;
    } else if (action === 'STEAL' && result.targetId) {
      const target = state.players[result.targetId];
      // Target might have gained a shield or cloak since the calculation (though unlikely in current serial process)
      if (target.buffs && (target.buffs.shieldSpins > 0 || target.buffs.cloakSpins > 0)) {
        // Blocked!
        return;
      }
      const stealAmount = Math.min(target.tokens, result.amount);
      target.tokens -= stealAmount;
      player.tokens += stealAmount;
    } else if (action === 'SHIELD') {
      player.buffs.shieldSpins = result.duration;
    } else if (action === 'REVIVE') {
      player.buffs.hasRevive = true;
    }
  }

  private static async logSpinToDb(subSessionId: string, playerId: string, actionType: ActionType, result: any) {
    await prisma.spin.create({
      data: {
        subSessionId,
        playerId,
        actionType,
        result: result as any,
      },
    });
    
    // If tokens changed, update ledger
    if (result.amount) {
      await prisma.tokenLedger.create({
        data: {
          userId: playerId,
          amount: result.amount,
          type: actionType === 'STEAL' ? 'STEAL' : 'GAME_WIN',
          referenceId: subSessionId,
        },
      });
    }
  }
}
