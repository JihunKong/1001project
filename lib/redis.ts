import { createClient } from 'redis';
import { logger } from './logger';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let isRedisConnected = false;
let connectionAttempted = false;

async function initializeRedis(): Promise<RedisClient | null> {
  if (connectionAttempted && redisClient) {
    return redisClient;
  }

  if (connectionAttempted && !redisClient) {
    return null;
  }

  connectionAttempted = true;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.warn('REDIS_URL not configured - using in-memory fallback for rate limiting');
    return null;
  }

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    client.on('error', (err) => {
      logger.error('Redis client error', err);
      isRedisConnected = false;
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
      isRedisConnected = true;
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
      isRedisConnected = true;
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
      isRedisConnected = false;
    });

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    logger.error('Failed to initialize Redis client', error);
    redisClient = null;
    return null;
  }
}

export async function getRedisClient(): Promise<RedisClient | null> {
  if (!redisClient || !isRedisConnected) {
    return await initializeRedis();
  }
  return redisClient;
}

export function isRedisAvailable(): boolean {
  return isRedisConnected && redisClient !== null;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Redis client', error);
    } finally {
      redisClient = null;
      isRedisConnected = false;
      connectionAttempted = false;
    }
  }
}

export async function testRedisConnection(): Promise<boolean> {
  const client = await getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Redis connection test failed', error);
    return false;
  }
}
