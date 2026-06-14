import prisma from '../config/prisma';
import redis from '../config/redis';
import { SubSessionState } from '../types/game';
import { sessionQueue } from '../config/bullmq';

export class SessionService {
  static async createSession(name: string, startTime: Date, rulesId: string) {
    const session = await prisma.session.create({
      data: {
        name,
        startTime,
        rulesId,
        status: 'PENDING',
      },
    });

    // Schedule activation
    const delay = startTime.getTime() - Date.now();
    await sessionQueue.add('start-session', { sessionId: session.id }, { delay: Math.max(0, delay) });

    return session;
  }

  static async activateSession(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { rules: true },
    });

    if (!session) throw new Error('Session not found');

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ACTIVE' },
    });

    await this.initializeSubSessions(session);
  }

  static async finishSession(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { subSessions: true },
    });

    if (!session) return;

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'COMPLETED', endTime: new Date() },
    });

    for (const subSession of session.subSessions) {
      const stateKey = `subsession:${subSession.id}:state`;
      const stateRaw = await redis.get(stateKey);
      
      if (stateRaw) {
        const state: SubSessionState = JSON.parse(stateRaw);
        
        // Sync each player's final state to DB
        for (const player of Object.values(state.players)) {
          await prisma.subSessionPlayer.update({
            where: {
              subSessionId_userId: {
                subSessionId: subSession.id,
                userId: player.userId,
              },
            },
            data: {
              status: player.status === 'ELIMINATED' ? 'ELIMINATED' : 'ALIVE',
              tokens: player.tokens,
              progress: player.progress,
            },
          });
        }
      }

      await prisma.subSession.update({
        where: { id: subSession.id },
        data: { status: 'FINISHED' },
      });

      // Clear Redis state
      await redis.del(stateKey);
    }

    // Trigger revenue distribution (which now includes RewardService)
    await sessionQueue.add('distribute-revenue', { sessionId });
  }

  private static async initializeSubSessions(session: any) {
    const TARGET_CAPACITY = 100;
    const MAX_CAPACITY = 110;
    
    // 1. Fetch all squads and solo players registered for this session
    const squads = await prisma.squad.findMany({
      include: { members: true },
    });

    const soloPlayers = await prisma.user.findMany({
      where: { squadId: null, type: 'REAL' },
    });

    let currentSubSessionId: string | null = null;
    let currentCapacity = 0;

    const createNewSubSession = async () => {
      const ss = await prisma.subSession.create({
        data: {
          sessionId: session.id,
          capacity: TARGET_CAPACITY,
          status: 'WAITING',
        },
      });
      const initialState: SubSessionState = {
        id: ss.id,
        sessionId: session.id,
        players: {},
        squadTokens: {},
        currentPhase: 1,
        status: 'WAITING',
        startTime: Date.now(),
        lastUpdate: Date.now(),
      };
      await redis.set(`subsession:${ss.id}:state`, JSON.stringify(initialState));
      return ss.id;
    };

    // Distribute Squads
    for (const squad of squads) {
      const squadSize = squad.members.length;

      // If squad size > MAX_CAPACITY, it gets its own overflow sub-session
      if (squadSize > MAX_CAPACITY) {
        const ssId = await createNewSubSession();
        await this.addSquadToSubSession(ssId, squad);
        continue;
      }

      // If adding squad exceeds MAX_CAPACITY, or we already hit TARGET_CAPACITY
      if (!currentSubSessionId || (currentCapacity + squadSize > MAX_CAPACITY) || (currentCapacity >= TARGET_CAPACITY)) {
        currentSubSessionId = await createNewSubSession();
        currentCapacity = 0;
      }

      await this.addSquadToSubSession(currentSubSessionId, squad);
      currentCapacity += squadSize;
    }

    // Distribute Solo Players
    for (const player of soloPlayers) {
      if (!currentSubSessionId || currentCapacity >= TARGET_CAPACITY) {
        currentSubSessionId = await createNewSubSession();
        currentCapacity = 0;
      }
      await this.addPlayerToSubSession(currentSubSessionId, player);
      currentCapacity++;
    }

    // Trigger Bot Injection for each sub-session
    const allSubSessions = await prisma.subSession.findMany({
      where: { sessionId: session.id },
    });

    for (const ss of allSubSessions) {
      const playerCount = await prisma.subSessionPlayer.count({
        where: { subSessionId: ss.id },
      });
      const botsNeeded = TARGET_CAPACITY - playerCount;
      if (botsNeeded > 0) {
        await sessionQueue.add('inject-bots', { subSessionId: ss.id, count: botsNeeded });
      }
    }
  }

  private static async addSquadToSubSession(subSessionId: string, squad: any) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    const state: SubSessionState = JSON.parse(stateRaw!);

    state.squadTokens[squad.id] = 0;

    for (const member of squad.members) {
      await prisma.subSessionPlayer.create({
        data: {
          subSessionId,
          userId: member.id,
          squadId: squad.id,
        },
      });

      state.players[member.id] = {
        userId: member.id,
        username: member.username,
        squadId: squad.id,
        status: 'ALIVE',
        tokens: 0,
        progress: 0,
        inventory: {},
      };
    }

    await redis.set(stateKey, JSON.stringify(state));
  }

  private static async addPlayerToSubSession(subSessionId: string, player: any) {
    const stateKey = `subsession:${subSessionId}:state`;
    const stateRaw = await redis.get(stateKey);
    const state: SubSessionState = JSON.parse(stateRaw!);

    await prisma.subSessionPlayer.create({
      data: {
        subSessionId,
        userId: player.id,
      },
    });

    state.players[player.id] = {
      userId: player.id,
      username: player.username,
      squadId: null,
      status: 'ALIVE',
      tokens: 0,
      progress: 0,
      inventory: {},
    };

    await redis.set(stateKey, JSON.stringify(state));
  }
}
