import { Redis } from 'ioredis';

class MockRedisClient {
  private cache: Map<string, { value: string; expiry?: number }> = new Map()
  
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  async set(key: string, value: string, expiryMode?: string, expiry?: number): Promise<string> {
    const expiryTime = expiry ? Date.now() + (expiry * 1000) : undefined
    this.cache.set(key, { value, expiry: expiryTime })
    return 'OK'
  }
  
  async del(...keys: string[]): Promise<number> {
    let deleted = 0
    for (const key of keys) {
      if (this.cache.has(key)) {
        this.cache.delete(key)
        deleted++
      }
    }
    return deleted
  }
  
  async exists(key: string): Promise<number> {
    const item = this.cache.get(key)
    
    if (!item) return 0
    
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return 0
    }
    
    return 1
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    return Array.from(this.cache.keys()).filter(key => regex.test(key))
  }
  
  async flushdb(): Promise<string> {
    this.cache.clear()
    return 'OK'
  }
  
  on(event: string, callback: Function) {
    // Mock event handling
  }
}

let redisClient: Redis | MockRedisClient | null = null;

export function getRedisClient(): Redis | MockRedisClient | null {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log('Redis not configured, using mock cache for development');
    if (!redisClient) {
      redisClient = new MockRedisClient();
    }
    return redisClient;
  }

  if (!redisClient) {
    try {
      if (process.env.REDIS_URL) {
        redisClient = new Redis(process.env.REDIS_URL);
      } else {
        redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
        });
      }

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Redis Client Connected');
      });
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      console.log('Falling back to mock cache');
      redisClient = new MockRedisClient();
    }
  }

  return redisClient;
}

export async function cacheGet(key: string): Promise<any | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

export async function cacheSet(
  key: string, 
  value: any, 
  ttlSeconds: number = 3600
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

export async function cacheFlush(pattern?: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    if (pattern) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } else {
      await client.flushdb();
    }
    return true;
  } catch (error) {
    console.error('Redis FLUSH error:', error);
    return false;
  }
}

export const CacheKeys = {
  USER_SESSION: (userId: string) => `session:${userId}`,
  BOOK_DATA: (bookId: string) => `book:${bookId}`,
  CLASS_DATA: (classId: string) => `class:${classId}`,
  ASSIGNED_BOOKS: (userId: string) => `assigned:${userId}`,
  REVIEW_QUEUE: (role: string) => `queue:${role}`,
  VOCABULARY: (userId: string, bookId: string) => `vocab:${userId}:${bookId}`,
  DISCUSSION: (clubId: string) => `discussion:${clubId}`,
  WORKFLOW_STATUS: (bookId: string) => `workflow:${bookId}`,
  AI_RESPONSE: (prompt: string) => `ai:${Buffer.from(prompt).toString('base64').slice(0, 20)}`,
};

export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  SESSION: 7200,    // 2 hours
};

export const redis = getRedisClient();