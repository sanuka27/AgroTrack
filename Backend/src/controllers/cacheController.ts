import { Request, Response } from 'express';
import { cache, CacheHelper } from '../config/redis';
import { CacheService, CacheKeys } from '../utils/cacheService';
import { CacheMonitor, CacheTagManager } from '../middleware/cacheMiddleware';
import logger from '../config/logger';

interface CacheHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  connected: boolean;
  stats: {
    hits: number;
    misses: number;
    totalRequests: number;
    hitRate: number;
    lastReset: Date;
  };
  keyMetrics: {
    totalKeys: number;
    keysByPattern: Record<string, number>;
    memoryUsage?: string;
  };
  info?: any;
  error?: string;
}

export class CacheController {
  // Get cache health and statistics
  static async getHealth(req: Request, res: Response): Promise<Response> {
    try {
      const healthCheck = await CacheMonitor.getHealthCheck();
      const keyMetrics = await CacheMonitor.getKeyMetrics();
      
      const response: CacheHealthResponse = {
        status: healthCheck.connected ? 'healthy' : 'unhealthy',
        connected: healthCheck.connected,
        stats: healthCheck.stats,
        keyMetrics,
        info: healthCheck.info,
        error: healthCheck.error
      };

      // Determine status based on hit rate and connection
      if (healthCheck.connected) {
        if (healthCheck.stats.hitRate < 50 && healthCheck.stats.totalRequests > 100) {
          response.status = 'degraded';
        }
      }

      return res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Cache health check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cache health status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get cache statistics
  static async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = cache.getStats();
      const keyMetrics = await CacheMonitor.getKeyMetrics();
      
      return res.json({
        success: true,
        data: {
          performance: stats,
          keys: keyMetrics,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Cache stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cache statistics'
      });
    }
  }

  // Clear cache by pattern
  static async clearByPattern(req: Request, res: Response): Promise<Response> {
    try {
      const { pattern } = req.params;
      const { confirm } = req.body;

      if (!pattern) {
        return res.status(400).json({
          success: false,
          error: 'Pattern is required'
        });
      }

      if (!confirm) {
        // Preview mode - show what would be deleted
        const keys = await cache.keys(pattern);
        return res.json({
          success: true,
          preview: true,
          data: {
            pattern,
            keysToDelete: keys.length,
            keys: keys.slice(0, 10), // Show first 10 keys as preview
            warning: `This will delete ${keys.length} cache entries`
          }
        });
      }

      // Actually delete the keys
      const deletedCount = await cache.deleteByPattern(pattern);
      
      logger.info(`Cache cleared: ${deletedCount} keys deleted for pattern ${pattern}`);
      
      return res.json({
        success: true,
        data: {
          pattern,
          deletedCount,
          message: `Successfully deleted ${deletedCount} cache entries`
        }
      });
    } catch (error) {
      logger.error('Cache clear by pattern error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cache by pattern'
      });
    }
  }

  // Clear cache by tags
  static async clearByTags(req: Request, res: Response): Promise<Response> {
    try {
      const { tags } = req.body;
      const { confirm } = req.body;

      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Tags array is required'
        });
      }

      if (!confirm) {
        // Preview mode - estimate what would be deleted
        return res.json({
          success: true,
          preview: true,
          data: {
            tags,
            warning: `This will delete all cache entries tagged with: ${tags.join(', ')}`
          }
        });
      }

      // Actually delete by tags
      const deletedCount = await CacheTagManager.invalidateByTags(tags);
      
      logger.info(`Cache cleared: ${deletedCount} keys deleted for tags ${tags.join(', ')}`);
      
      return res.json({
        success: true,
        data: {
          tags,
          deletedCount,
          message: `Successfully deleted ${deletedCount} cache entries`
        }
      });
    } catch (error) {
      logger.error('Cache clear by tags error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cache by tags'
      });
    }
  }

  // Clear specific cache types
  static async clearByType(req: Request, res: Response): Promise<Response> {
    try {
      const { type } = req.params;
      const { userId, confirm } = req.body;

      if (!type) {
        return res.status(400).json({
          success: false,
          error: 'Cache type is required'
        });
      }

      let patterns: string[] = [];
      let description = '';

      switch (type.toLowerCase()) {
        case 'user':
          if (!userId) {
            return res.status(400).json({
              success: false,
              error: 'userId is required for user cache clearing'
            });
          }
          patterns = [`user:${userId}*`, `analytics:user:${userId}*`, `notifications:${userId}*`];
          description = `user cache for user ${userId}`;
          break;

        case 'search':
          patterns = ['search:*'];
          description = 'all search cache';
          break;

        case 'analytics':
          patterns = userId ? [`analytics:user:${userId}*`] : ['analytics:*'];
          description = userId ? `analytics cache for user ${userId}` : 'all analytics cache';
          break;

        case 'community':
          patterns = ['community:*'];
          description = 'all community cache';
          break;

        case 'weather':
          patterns = ['weather:*'];
          description = 'all weather cache';
          break;

        case 'plants':
          patterns = userId ? [`user:plants:${userId}*`, 'plant:*'] : ['plant:*'];
          description = userId ? `plant cache for user ${userId}` : 'all plant cache';
          break;

        default:
          return res.status(400).json({
            success: false,
            error: `Unknown cache type: ${type}. Valid types: user, search, analytics, community, weather, plants`
          });
      }

      if (!confirm) {
        // Preview mode
        let totalKeys = 0;
        for (const pattern of patterns) {
          const keys = await cache.keys(pattern);
          totalKeys += keys.length;
        }

        return res.json({
          success: true,
          preview: true,
          data: {
            type,
            patterns,
            keysToDelete: totalKeys,
            description,
            warning: `This will delete ${totalKeys} cache entries for ${description}`
          }
        });
      }

      // Actually clear cache
      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await cache.deleteByPattern(pattern);
        totalDeleted += deleted;
      }

      logger.info(`Cache cleared: ${totalDeleted} keys deleted for type ${type}`);

      return res.json({
        success: true,
        data: {
          type,
          patterns,
          deletedCount: totalDeleted,
          description,
          message: `Successfully cleared ${description} (${totalDeleted} entries)`
        }
      });
    } catch (error) {
      logger.error('Cache clear by type error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to clear cache by type'
      });
    }
  }

  // Flush all cache
  static async flushAll(req: Request, res: Response): Promise<Response> {
    try {
      const { confirm } = req.body;

      if (!confirm) {
        const keyMetrics = await CacheMonitor.getKeyMetrics();
        return res.json({
          success: true,
          preview: true,
          data: {
            totalKeys: keyMetrics.totalKeys,
            warning: `This will delete ALL ${keyMetrics.totalKeys} cache entries. This action cannot be undone.`,
            keysByPattern: keyMetrics.keysByPattern
          }
        });
      }

      const success = await cache.flushAll();
      
      if (success) {
        logger.warn('All cache entries have been flushed');
        return res.json({
          success: true,
          data: {
            message: 'All cache entries have been cleared successfully'
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to flush cache'
        });
      }
    } catch (error) {
      logger.error('Cache flush all error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to flush all cache'
      });
    }
  }

  // Warm cache
  static async warmCache(req: Request, res: Response): Promise<Response> {
    try {
      const { CacheWarmer } = await import('../middleware/cacheMiddleware');
      
      // Add some common warmup tasks
      CacheWarmer.addWarmupTask({
        name: 'Popular Search Terms',
        key: CacheKeys.popularSearches(),
        fetchFunction: async () => {
          // This would typically fetch from analytics or database
          return ['watering', 'fertilizing', 'pruning', 'repotting', 'disease'];
        },
        ttl: 3600
      });

      // Start cache warming
      await CacheWarmer.warmCache();

      return res.json({
        success: true,
        data: {
          message: 'Cache warming completed successfully'
        }
      });
    } catch (error) {
      logger.error('Cache warm error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to warm cache'
      });
    }
  }

  // Get cache key info
  static async getKeyInfo(req: Request, res: Response): Promise<Response> {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Cache key is required'
        });
      }

      const exists = await cache.exists(key);
      if (!exists) {
        return res.status(404).json({
          success: false,
          error: 'Cache key not found'
        });
      }

      const value = await cache.get(key);
      const ttl = await cache.redis.ttl(key);

      return res.json({
        success: true,
        data: {
          key,
          exists,
          ttl: ttl > 0 ? ttl : null,
          size: JSON.stringify(value).length,
          type: Array.isArray(value) ? 'array' : typeof value,
          value: req.query.include_value === 'true' ? value : '[hidden]'
        }
      });
    } catch (error) {
      logger.error('Cache key info error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get cache key info'
      });
    }
  }

  // Set cache key
  static async setKey(req: Request, res: Response): Promise<Response> {
    try {
      const { key } = req.params;
      const { value, ttl } = req.body;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Cache key is required'
        });
      }

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Value is required'
        });
      }

      const success = await cache.set(key, value, ttl);

      if (success) {
        return res.json({
          success: true,
          data: {
            key,
            ttl: ttl || cache.config?.defaultTTL,
            message: 'Cache key set successfully'
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to set cache key'
        });
      }
    } catch (error) {
      logger.error('Cache set key error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to set cache key'
      });
    }
  }

  // Delete cache key
  static async deleteKey(req: Request, res: Response): Promise<Response> {
    try {
      const { key } = req.params;

      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Cache key is required'
        });
      }

      const deletedCount = await cache.del(key);

      return res.json({
        success: true,
        data: {
          key,
          deleted: deletedCount > 0,
          message: deletedCount > 0 ? 'Cache key deleted successfully' : 'Cache key not found'
        }
      });
    } catch (error) {
      logger.error('Cache delete key error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete cache key'
      });
    }
  }

  // Reset cache statistics
  static async resetStats(req: Request, res: Response): Promise<Response> {
    try {
      cache.resetStats();
      
      return res.json({
        success: true,
        data: {
          message: 'Cache statistics reset successfully',
          resetAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Cache reset stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to reset cache statistics'
      });
    }
  }
}

export default CacheController;