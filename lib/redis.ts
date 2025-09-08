// Redis client for caching
// This is a mock implementation for testing
// In production, use a real Redis client like ioredis

class MockRedisClient {
  private cache: Map<string, { value: string; expiry?: number }> = new Map()
  
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    // Check expiry
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
  
  async del(key: string): Promise<number> {
    const had = this.cache.has(key)
    this.cache.delete(key)
    return had ? 1 : 0
  }
  
  async exists(key: string): Promise<number> {
    const item = this.cache.get(key)
    
    if (!item) return 0
    
    // Check expiry
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key)
      return 0
    }
    
    return 1
  }
  
  async expire(key: string, seconds: number): Promise<number> {
    const item = this.cache.get(key)
    if (!item) return 0
    
    item.expiry = Date.now() + (seconds * 1000)
    return 1
  }
  
  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key)
    
    if (!item) return -2 // Key does not exist
    if (!item.expiry) return -1 // No expiry
    
    const remaining = Math.floor((item.expiry - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }
  
  async flushall(): Promise<string> {
    this.cache.clear()
    return 'OK'
  }
}

// Create singleton instance
let redisClient: MockRedisClient | null = null

export function getRedisClient(): MockRedisClient {
  if (!redisClient) {
    redisClient = new MockRedisClient()
    
    // Log Redis connection status
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      console.log('🔴 Using Mock Redis Client (for testing only)')
    }
  }
  
  return redisClient
}

export const redis = getRedisClient()