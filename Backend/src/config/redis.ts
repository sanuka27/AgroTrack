import Redis from 'ioredis';
import logger from './logger';

interface CacheConfig {
  defaultTTL: number;
  keyPrefix: string;
  maxRetries: number;
  retryDelayOnFailover: number;
  enableOfflineQueue: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  lastReset: Date;
}

export class RedisCache {
  private static instance: RedisCache;
  public redis: Redis | null = null;
  public config: CacheConfig;
  private stats: CacheStats;
  private isConnected: boolean = false;
  private isDisabled: boolean = false;

  constructor() {
    this.isDisabled = process.env.DISABLE_REDIS === 'true' || !process.env.REDIS_URL;

    this.config = {
      defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'), // 1 hour
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'agrotrack:',
      maxRetries: 3,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      lastReset: new Date()
    };

    // Do not create Redis instance on import - only create in connect()
  }

  public static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache();
    }
    return RedisCache.instance;
  }

  private setupEventHandlers(): void {
    if (!this.redis) return;

    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.redis.on('ready', () => {
      logger.info('Redis is ready to accept commands');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    if (this.isDisabled) {
      logger.info('Redis is disabled (DISABLE_REDIS=true or no REDIS_URL), skipping connection');
      return;
    }

    if (this.redis) {
      logger.info('Redis already connected');
      return;
    }

    try {
      // Create Redis instance only when connect() is called
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: this.config.keyPrefix,
        maxRetriesPerRequest: this.config.maxRetries,
        enableOfflineQueue: this.config.enableOfflineQueue,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      this.setupEventHandlers();
      await this.redis.connect();
      logger.info('Redis cache initialized successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isDisabled || !this.redis) {
      logger.info('Redis is disabled, skipping disconnect');
      return;
    }

    try {
      await this.redis.disconnect();
      logger.info('Redis disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  public isHealthy(): boolean {
    return !this.isDisabled && this.isConnected;
  }

  private isRedisAvailable(): boolean {
    return !this.isDisabled && this.redis !== null && this.isConnected;
  }

  // Basic cache operations
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable()) {
      this.updateStats(false);
      return null;
    }

    try {
      const value = await this.redis!.get(key);
      if (value) {
        this.updateStats(true);
        return JSON.parse(value);
      } else {
        this.updateStats(false);
        return null;
      }
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      this.updateStats(false);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.config.defaultTTL;
      
      await this.redis!.setex(key, expiration, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  public async del(key: string | string[]): Promise<number> {
    if (!this.isRedisAvailable()) {
      return 0;
    }

    try {
      if (Array.isArray(key)) {
        return await this.redis!.del(...key);
      } else {
        return await this.redis!.del(key);
      }
    } catch (error) {
      logger.error(`Redis DEL error for key(s) ${key}:`, error);
      return 0;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      const exists = await this.redis!.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      const result = await this.redis!.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    if (!this.isRedisAvailable()) {
      return -1;
    }

    try {
      const result = await this.redis!.ttl(key);
      return result;
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Pattern-based operations
  public async keys(pattern: string): Promise<string[]> {
    if (!this.isRedisAvailable()) {
      return [];
    }

    try {
      return await this.redis!.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  public async deleteByPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        return await this.del(keys);
      }
      return 0;
    } catch (error) {
      logger.error(`Redis DELETE BY PATTERN error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Hash operations
  public async hget<T>(key: string, field: string): Promise<T | null> {
    if (!this.isRedisAvailable()) {
      return null;
    }

    try {
      const value = await this.redis!.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  public async hset<T>(key: string, field: string, value: T): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.redis!.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  public async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.isRedisAvailable()) {
      return null;
    }

    try {
      const hash = await this.redis!.hgetall(key);
      if (Object.keys(hash).length === 0) {
        return null;
      }

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, error);
      return null;
    }
  }

  // List operations
  public async lpush<T>(key: string, value: T): Promise<number> {
    if (!this.isRedisAvailable()) {
      return 0;
    }

    try {
      const serializedValue = JSON.stringify(value);
      return await this.redis!.lpush(key, serializedValue);
    } catch (error) {
      logger.error(`Redis LPUSH error for key ${key}:`, error);
      return 0;
    }
  }

  public async rpop<T>(key: string): Promise<T | null> {
    if (!this.isRedisAvailable()) {
      return null;
    }

    try {
      const value = await this.redis!.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis RPOP error for key ${key}:`, error);
      return null;
    }
  }

  public async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    if (!this.isRedisAvailable()) {
      return [];
    }

    try {
      const values = await this.redis!.lrange(key, start, stop);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      logger.error(`Redis LRANGE error for key ${key}:`, error);
      return [];
    }
  }

  // Set operations
  public async sadd<T>(key: string, member: T): Promise<number> {
    if (!this.isRedisAvailable()) {
      return 0;
    }

    try {
      const serializedMember = JSON.stringify(member);
      return await this.redis!.sadd(key, serializedMember);
    } catch (error) {
      logger.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  }

  public async smembers<T>(key: string): Promise<T[]> {
    if (!this.isRedisAvailable()) {
      return [];
    }

    try {
      const members = await this.redis!.smembers(key);
      return members.map(member => JSON.parse(member));
    } catch (error) {
      logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  public async sismember<T>(key: string, member: T): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      const serializedMember = JSON.stringify(member);
      const result = await this.redis!.sismember(key, serializedMember);
      return result === 1;
    } catch (error) {
      logger.error(`Redis SISMEMBER error for key ${key}:`, error);
      return false;
    }
  }

  // Cache management
  public async flushAll(): Promise<boolean> {
    if (!this.isRedisAvailable()) {
      return false;
    }

    try {
      await this.redis!.flushall();
      this.resetStats();
      return true;
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error);
      return false;
    }
  }

  public async getInfo(): Promise<any> {
    if (!this.isRedisAvailable()) {
      return null;
    }

    try {
      const info = await this.redis!.info();
      return info;
    } catch (error) {
      logger.error('Redis INFO error:', error);
      return null;
    }
  }

  // Statistics
  private updateStats(hit: boolean): void {
    this.stats.totalRequests++;
    if (hit) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    this.stats.hitRate = (this.stats.hits / this.stats.totalRequests) * 100;
  }

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      hitRate: 0,
      lastReset: new Date()
    };
  }

  // Transaction support
  public async multi(commands: Array<{ method: string; args: any[] }>): Promise<any[]> {
    if (!this.isRedisAvailable()) {
      return [];
    }

    try {
      const pipeline = this.redis!.multi();
      for (const command of commands) {
        (pipeline as any)[command.method](...command.args);
      }
      
      const results = await pipeline.exec();
      return results?.map(result => result[1]) || [];
    } catch (error) {
      logger.error('Redis MULTI error:', error);
      return [];
    }
  }

  // Pipeline support
  public async pipeline(commands: Array<{ method: string; args: any[] }>): Promise<any[]> {
    if (!this.isRedisAvailable()) {
      return [];
    }

    try {
      const pipeline = this.redis!.pipeline();
      for (const command of commands) {
        (pipeline as any)[command.method](...command.args);
      }
      
      const results = await pipeline.exec();
      return results?.map(result => result[1]) || [];
    } catch (error) {
      logger.error('Redis PIPELINE error:', error);
      return [];
    }
  }
}

// Create and export singleton instance
export const cache = RedisCache.getInstance();

// Helper functions for common cache patterns
export class CacheHelper {
  // Cache-aside pattern
  static async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T | null> {
    try {
      // Try to get from cache first
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch from source
      const data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await cache.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      logger.error(`Cache getOrSet error for key ${key}:`, error);
      // Fallback to direct fetch if cache fails
      try {
        return await fetchFunction();
      } catch (fetchError) {
        logger.error(`Fetch fallback error for key ${key}:`, fetchError);
        return null;
      }
    }
  }

  // Write-through pattern
  static async setAndPersist<T>(
    key: string,
    value: T,
    persistFunction: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<boolean> {
    try {
      // Persist to database first
      await persistFunction(value);
      
      // Then cache the value
      return await cache.set(key, value, ttl);
    } catch (error) {
      logger.error(`Cache setAndPersist error for key ${key}:`, error);
      return false;
    }
  }

  // Write-behind pattern
  static async setAndSchedulePersist<T>(
    key: string,
    value: T,
    persistFunction: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<boolean> {
    try {
      // Cache the value immediately
      const cacheSuccess = await cache.set(key, value, ttl);
      
      // Schedule persistence (fire and forget)
      setImmediate(async () => {
        try {
          await persistFunction(value);
        } catch (error) {
          logger.error(`Scheduled persist error for key ${key}:`, error);
        }
      });

      return cacheSuccess;
    } catch (error) {
      logger.error(`Cache setAndSchedulePersist error for key ${key}:`, error);
      return false;
    }
  }

  // Refresh-ahead pattern
  static async refreshAhead<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number,
    refreshThreshold: number = 0.8
  ): Promise<T | null> {
    try {
      const cache = RedisCache.getInstance();
      const cached = await cache.get<T>(key);
      if (cached !== null) {
        // Check if we need to refresh proactively
        if (cache.redis) {
          const keyTtl = await cache.redis.ttl(key);
          if (keyTtl > 0 && keyTtl < (ttl * refreshThreshold)) {
            // Refresh in background
            setImmediate(async () => {
              try {
                const freshData = await fetchFunction();
                if (freshData !== null && freshData !== undefined) {
                  await cache.set(key, freshData, ttl);
                }
              } catch (error) {
                logger.error(`Background refresh error for key ${key}:`, error);
              }
            });
          }
        }
        return cached;
      }

      // If not in cache, fetch and cache
      const data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await cache.set(key, data, ttl);
      }

      return data;
    } catch (error) {
      logger.error(`Cache refreshAhead error for key ${key}:`, error);
      return null;
    }
  }
}

export default cache;