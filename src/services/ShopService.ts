import prisma from '../config/prisma';
import redis from '../config/redis';
import { SubSessionState } from '../types/game';

export class ShopService {
  static async purchaseItem(subSessionId: string, userId: string, itemId: string) {
    const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item not found');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || Number(user.balance) < Number(item.price)) {
      throw new Error('Insufficient balance');
    }

    // Atomic transaction for purchase
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: item.price } },
      }),
      prisma.tokenLedger.create({
        data: {
          userId,
          amount: -item.price,
          type: 'ITEM_PURCHASE',
          referenceId: itemId,
        },
      }),
      prisma.userInventory.upsert({
        where: { userId_itemId: { userId, itemId } },
        update: { quantity: { increment: 1 } },
        create: { userId, itemId, quantity: 1 },
      }),
    ]);

    // Update real-time state if in a sub-session
    if (subSessionId) {
      await this.applyItemToSessionState(subSessionId, userId, item);
    }

    return item;
  }

  private static async applyItemToSessionState(subSessionId: string, userId: string, item: any) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    if (!stateRaw) return;

    const state: SubSessionState = JSON.parse(stateRaw);
    const player = state.players[userId];
    if (!player) return;

    if (!player.buffs) {
      player.buffs = { shieldSpins: 0, cloakSpins: 0, hasInsurance: false, hasRevive: false };
    }

    switch (item.type) {
      case 'SHIELD':
        player.buffs.shieldSpins += 3;
        break;
      case 'CLOAK':
        player.buffs.cloakSpins += 5;
        break;
      case 'INSURANCE':
        player.buffs.hasInsurance = true;
        break;
      case 'REVIVE':
        player.buffs.hasRevive = true;
        break;
    }

    await redis.set(stateKey, JSON.stringify(state));
  }
}
