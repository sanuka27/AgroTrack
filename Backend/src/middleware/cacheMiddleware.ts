import { Request, Response, NextFunction } from 'express';
import { cache, CacheHelper } from '../config/redis';
import logger from '../config/logger';

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  varyBy?: string[];
  tags?: string[];
}

interface CacheMiddlewareOptions extends CacheOptions {
  defaultTTL: number;
  defaultKeyPrefix: string;
}

// Cache middleware for automatic request/response caching
export function cacheMiddleware(options: Partial<CacheMiddlewareOptions> = {}) {
  const config: CacheMiddlewareOptions = {
    defaultTTL: 300, // 5 minutes
    defaultKeyPrefix: 'route:',
    ...options
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check if we should skip caching for this request
    if (config.skipCache && config.skipCache(req)) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = config.keyGenerator 
        ? config.keyGenerator(req)
        : generateDefaultCacheKey(req, config.defaultKeyPrefix, config.varyBy);

      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);
      if (cachedResponse) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      logger.debug(`Cache MISS for key: ${cacheKey}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data: any) {
        // Cache the response data
        const ttl = config.ttl || config.defaultTTL;
        cache.set(cacheKey, data, ttl).catch(error => {
          logger.error(`Failed to cache response for key ${cacheKey}:`, error);
        });

        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

// Generate default cache key
function generateDefaultCacheKey(req: Request, prefix: string, varyBy?: string[]): string {
  let key = `${prefix}${req.path}`;
  
  // Add query parameters to key
  const queryKeys = Object.keys(req.query).sort();
  if (queryKeys.length > 0) {
    const queryString = queryKeys
      .map(k => `${k}=${req.query[k]}`)
      .join('&');
    key += `?${queryString}`;
  }

  // Add vary-by parameters
  if (varyBy) {
    const varyValues = varyBy
      .map(header => req.headers[header.toLowerCase()] || req.get(header) || '')
      .join('|');
    if (varyValues) {
      key += `|vary:${varyValues}`;
    }
  }

  // Add user ID if authenticated
  const user = (req as any).user;
  if (user && user.id) {
    key += `|user:${user.id}`;
  }

  return key;
}

// Invalidation middleware
export function invalidateCache(patterns: string[] | ((req: Request) => string[])) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invalidationPatterns = typeof patterns === 'function' 
        ? patterns(req) 
        : patterns;

      // Store patterns for post-request invalidation
      (req as any).cacheInvalidationPatterns = invalidationPatterns;

      // Store original res.json function
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Override response methods to invalidate cache after successful response
      const invalidateAfterResponse = function(data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Invalidate cache patterns asynchronously
          setImmediate(async () => {
            for (const pattern of invalidationPatterns) {
              try {
                const deletedCount = await cache.deleteByPattern(pattern);
                logger.debug(`Invalidated ${deletedCount} cache entries for pattern: ${pattern}`);
              } catch (error) {
                logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
              }
            }
          });
        }
        return data;
      };

      res.json = function(data: any) {
        invalidateAfterResponse(data);
        return originalJson(data);
      };

      res.send = function(data: any) {
        invalidateAfterResponse(data);
        return originalSend(data);
      };

      next();
    } catch (error) {
      logger.error('Cache invalidation middleware error:', error);
      next();
    }
  };
}

// Tag-based cache invalidation
export class CacheTagManager {
  private static readonly TAG_KEY_PREFIX = 'tag:';

  static async tagKey(key: string, tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `${this.TAG_KEY_PREFIX}${tag}`;
        await cache.sadd(tagKey, key);
      }
    } catch (error) {
      logger.error(`Failed to tag key ${key} with tags ${tags.join(', ')}:`, error);
    }
  }

  static async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `${this.TAG_KEY_PREFIX}${tag}`;
      const keys = await cache.smembers<string>(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }

      // Delete all keys associated with the tag
      const deletedCount = await cache.del(keys);
      
      // Remove the tag set itself
      await cache.del(tagKey);

      logger.debug(`Invalidated ${deletedCount} keys for tag: ${tag}`);
      return deletedCount;
    } catch (error) {
      logger.error(`Failed to invalidate cache by tag ${tag}:`, error);
      return 0;
    }
  }

  static async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalDeleted = 0;
      for (const tag of tags) {
        totalDeleted += await this.invalidateByTag(tag);
      }
      return totalDeleted;
    } catch (error) {
      logger.error(`Failed to invalidate cache by tags ${tags.join(', ')}:`, error);
      return 0;
    }
  }
}

// Specialized cache decorators for common patterns
export class CacheDecorators {
  // Cache with automatic invalidation on mutations
  static withCache<T>(options: {
    key: string;
    ttl?: number;
    tags?: string[];
    refreshThreshold?: number;
  }) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const cacheKey = `method:${target.constructor.name}.${propertyName}:${options.key}`;
        
        if (options.refreshThreshold) {
          return await CacheHelper.refreshAhead(
            cacheKey,
            () => method.apply(this, args),
            options.ttl || 300,
            options.refreshThreshold
          );
        } else {
          return await CacheHelper.getOrSet(
            cacheKey,
            () => method.apply(this, args),
            options.ttl
          );
        }
      };
    };
  }

  // Invalidate cache on method execution
  static invalidateCache(patterns: string[] | string) {
    return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const result = await method.apply(this, args);
        
        // Invalidate cache patterns after successful execution
        const invalidationPatterns = Array.isArray(patterns) ? patterns : [patterns];
        setImmediate(async () => {
          for (const pattern of invalidationPatterns) {
            try {
              await cache.deleteByPattern(pattern);
            } catch (error) {
              logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
            }
          }
        });

        return result;
      };
    };
  }
}

// Cache warming utilities
export class CacheWarmer {
  private static warmupTasks: Array<{
    name: string;
    key: string;
    fetchFunction: () => Promise<any>;
    ttl?: number;
    interval?: number;
  }> = [];

  static addWarmupTask(task: {
    name: string;
    key: string;
    fetchFunction: () => Promise<any>;
    ttl?: number;
    interval?: number;
  }): void {
    this.warmupTasks.push(task);
  }

  static async warmCache(): Promise<void> {
    logger.info(`Starting cache warmup for ${this.warmupTasks.length} tasks`);
    
    const results = await Promise.allSettled(
      this.warmupTasks.map(async (task) => {
        try {
          const data = await task.fetchFunction();
          await cache.set(task.key, data, task.ttl);
          logger.debug(`Cache warmed for task: ${task.name}`);
        } catch (error) {
          logger.error(`Failed to warm cache for task ${task.name}:`, error);
          throw error;
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Cache warmup completed: ${successful} successful, ${failed} failed`);
  }

  static startPeriodicWarmup(): void {
    this.warmupTasks.forEach(task => {
      if (task.interval) {
        setInterval(async () => {
          try {
            const data = await task.fetchFunction();
            await cache.set(task.key, data, task.ttl);
            logger.debug(`Periodic cache refresh for task: ${task.name}`);
          } catch (error) {
            logger.error(`Failed to refresh cache for task ${task.name}:`, error);
          }
        }, task.interval);
      }
    });
  }
}

// Cache statistics and monitoring
export class CacheMonitor {
  static async getHealthCheck(): Promise<{
    connected: boolean;
    stats: any;
    info?: any;
    error?: string;
  }> {
    try {
      const connected = cache.isHealthy();
      const stats = cache.getStats();
      
      if (connected) {
        const info = await cache.getInfo();
        return { connected, stats, info };
      } else {
        return { connected, stats, error: 'Redis not connected' };
      }
    } catch (error) {
      return {
        connected: false,
        stats: cache.getStats(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async getKeyMetrics(): Promise<{
    totalKeys: number;
    keysByPattern: Record<string, number>;
    memoryUsage?: string;
  }> {
    try {
      const info = await cache.getInfo();
      const totalKeys = await cache.keys('*').then(keys => keys.length);
      
      // Get key distribution by common patterns
      const patterns = ['route:*', 'user:*', 'plant:*', 'search:*', 'analytics:*'];
      const keysByPattern: Record<string, number> = {};
      
      for (const pattern of patterns) {
        const keys = await cache.keys(pattern);
        keysByPattern[pattern] = keys.length;
      }

      // Extract memory usage from Redis info
      const memoryMatch = info?.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : undefined;

      return { totalKeys, keysByPattern, memoryUsage };
    } catch (error) {
      logger.error('Failed to get cache key metrics:', error);
      return { totalKeys: 0, keysByPattern: {} };
    }
  }
}

export default {
  cacheMiddleware,
  invalidateCache,
  CacheTagManager,
  CacheDecorators,
  CacheWarmer,
  CacheMonitor
};