import { Worker } from 'bullmq';
import { redis as connection } from '../config/redis';
import { BotEngine } from '../services/BotEngine';
import { SessionService } from '../services/SessionService';
import { CampService } from '../services/CampService';
import { RewardService } from '../services/RewardService';

export const sessionWorker = new Worker('session-queue', async (job) => {
  if (job.name === 'start-session') {
    const { sessionId } = job.data;
    await SessionService.activateSession(sessionId);
    console.log(`Session ${sessionId} activated`);
  } else if (job.name === 'inject-bots') {
    const { subSessionId, count } = job.data;
    await BotEngine.injectBots(subSessionId, count || 99);
    console.log(`Injected ${count || 99} bots into subsession ${subSessionId}`);
  } else if (job.name === 'distribute-revenue') {
    const { sessionId } = job.data;
    await CampService.distributeRevenue(sessionId);
    await RewardService.distributeRewards(sessionId);
    console.log(`Revenue and Rewards distributed for session ${sessionId}`);
  }
}, { connection });

export const botWorker = new Worker('bot-queue', async (job) => {
  if (job.name === 'simulate-bots') {
    const { subSessionId } = job.data;
    await BotEngine.simulateBotActions(subSessionId);
  }
}, { connection });
