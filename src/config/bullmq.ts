import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis as connection } from './redis';

export const sessionQueue = new Queue('session-queue', { connection });
export const spinQueue = new Queue('spin-queue', { connection });
export const botQueue = new Queue('bot-queue', { connection });

export { Worker, QueueEvents };
