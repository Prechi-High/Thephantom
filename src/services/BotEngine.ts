import prisma from '../config/prisma';
import redis from '../config/redis';
import { SubSessionState, PlayerState } from '../types/game';
import { GameEngine } from './GameEngine';
import { ActionType } from '@prisma/client';

export type BotArchetype = 'AGGRESSIVE' | 'DEFENSIVE' | 'BALANCED';

export class BotEngine {
  static async injectBots(subSessionId: string, count: number) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    if (!stateRaw) return;

    const state: SubSessionState = JSON.parse(stateRaw);
    const archetypes: BotArchetype[] = ['AGGRESSIVE', 'DEFENSIVE', 'BALANCED'];

    for (let i = 0; i < count; i++) {
      const botId = `bot_${subSessionId}_${i}`;
      const botName = `PhantomBot_${i}`;
      const archetype = archetypes[i % archetypes.length];

      await prisma.user.upsert({
        where: { username: botName },
        update: {},
        create: {
          id: botId,
          username: botName,
          type: 'BOT',
        },
      });

      await prisma.subSessionPlayer.create({
        data: {
          subSessionId,
          userId: botId,
        },
      });

      const botState: PlayerState & { archetype: BotArchetype } = {
        userId: botId,
        username: botName,
        squadId: null,
        status: 'ALIVE',
        tokens: 0,
        progress: 0,
        inventory: {},
        archetype,
      };

      state.players[botId] = botState as any;
    }

    await redis.set(stateKey, JSON.stringify(state));
  }

  static async simulateBotActions(subSessionId: string) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    if (!stateRaw) return;

    const state: SubSessionState = JSON.parse(stateRaw);

    if (state.status === 'WAITING') {
      // Shop Phase: Bots buy items
      await this.simulateBotShopping(subSessionId, state);
      return;
    }

    const botIds = Object.keys(state.players).filter(id => id.startsWith('bot_'));
...
  private static async simulateBotShopping(subSessionId: string, state: SubSessionState) {
    const botIds = Object.keys(state.players).filter(id => id.startsWith('bot_'));
    const items = await prisma.shopItem.findMany();

    for (const botId of botIds) {
      if (Math.random() > 0.3) continue; // 30% chance to buy something

      const item = items[Math.floor(Math.random() * items.length)];
      // For bots, we assume they have "bot tokens" or just grant the item for simulation
      const player = state.players[botId];
      if (!player.buffs) {
        player.buffs = { shieldSpins: 0, cloakSpins: 0, hasInsurance: false, hasRevive: false };
      }

      if (item.type === 'SHIELD') player.buffs.shieldSpins += 3;
      if (item.type === 'CLOAK') player.buffs.cloakSpins += 5;
      if (item.type === 'INSURANCE') player.buffs.hasInsurance = true;
      if (item.type === 'REVIVE') player.buffs.hasRevive = true;
    }

    await redis.set(`subsession:${subSessionId}:state`, JSON.stringify(state));
  }

    for (const botId of botIds) {
      const player = state.players[botId] as any;
      if (player.status === 'ELIMINATED') continue;

      const delay = Math.floor(Math.random() * 8000) + 2000; // 2-10s
      setTimeout(async () => {
        try {
          const action = this.decideAction(player, state);
          await GameEngine.processSpin(subSessionId, botId, action);
        } catch (err) {
          console.error(`Bot ${botId} spin failed`, err);
        }
      }, delay);
    }
  }

  private static decideAction(player: any, state: SubSessionState): ActionType {
    const archetype: BotArchetype = player.archetype || 'BALANCED';
    const weights: Record<ActionType, number> = {
      ADVANCE: 10,
      TOKEN: 10,
      STEAL: 10,
      SHIELD: 10,
      REVIVE: 1,
    };

    if (archetype === 'AGGRESSIVE') {
      weights.STEAL = 40;
      weights.ADVANCE = 20;
    } else if (archetype === 'DEFENSIVE') {
      weights.SHIELD = 40;
      weights.ADVANCE = 20;
    } else {
      weights.ADVANCE = 30;
      weights.TOKEN = 30;
    }

    // Logic: If tokens low, prioritize TOKEN
    if (player.tokens < 10) weights.TOKEN += 20;

    return this.weightedRandom(weights);
  }

  private static weightedRandom(weights: Record<string, number>): any {
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (const [action, weight] of Object.entries(weights)) {
      if (random < weight) return action;
      random -= weight;
    }
    return 'ADVANCE';
  }
}
