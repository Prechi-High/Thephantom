import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

export const redis = new Redis(redisConfig);
export const pubClient = new Redis(redisConfig);
export const subClient = new Redis(redisConfig);

export default redis;
