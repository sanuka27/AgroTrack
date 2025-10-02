import { cache, CacheHelper } from '../config/redis';
import logger from '../config/logger';

// Cache key generators
export class CacheKeys {
  // User-related cache keys
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userProfile(userId: string): string {
    return `user:profile:${userId}`;
  }

  static userPreferences(userId: string): string {
    return `user:preferences:${userId}`;
  }

  static userPlants(userId: string, page?: number): string {
    return page ? `user:plants:${userId}:page:${page}` : `user:plants:${userId}`;
  }

  // Plant-related cache keys
  static plant(plantId: string): string {
    return `plant:${plantId}`;
  }

  static plantDetails(plantId: string): string {
    return `plant:details:${plantId}`;
  }

  static plantCareLog(plantId: string, page?: number): string {
    return page ? `plant:carelog:${plantId}:page:${page}` : `plant:carelog:${plantId}`;
  }

  static plantReminders(plantId: string): string {
    return `plant:reminders:${plantId}`;
  }

  static plantAnalytics(plantId: string, period: string): string {
    return `plant:analytics:${plantId}:${period}`;
  }

  // Search-related cache keys
  static search(query: string, filters?: Record<string, any>): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    const hash = require('crypto').createHash('md5').update(query + filterString).digest('hex');
    return `search:${hash}`;
  }

  static searchSuggestions(query: string): string {
    return `search:suggestions:${query.toLowerCase()}`;
  }

  static popularSearches(): string {
    return 'search:popular';
  }

  // Analytics cache keys
  static userAnalytics(userId: string, period: string): string {
    return `analytics:user:${userId}:${period}`;
  }

  static systemAnalytics(period: string): string {
    return `analytics:system:${period}`;
  }

  static dashboardAnalytics(userId: string): string {
    return `analytics:dashboard:${userId}`;
  }

  // Community-related cache keys
  static communityPosts(page: number, filters?: Record<string, any>): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    const hash = require('crypto').createHash('md5').update(filterString).digest('hex');
    return `community:posts:page:${page}:${hash}`;
  }

  static userPosts(userId: string, page?: number): string {
    return page ? `community:posts:user:${userId}:page:${page}` : `community:posts:user:${userId}`;
  }

  static postComments(postId: string): string {
    return `community:post:comments:${postId}`;
  }

  // Weather cache keys
  static weather(location: string): string {
    return `weather:${location.toLowerCase().replace(/\s+/g, '_')}`;
  }

  static weatherForecast(location: string, days: number): string {
    return `weather:forecast:${location.toLowerCase().replace(/\s+/g, '_')}:${days}d`;
  }

  // Disease detection cache keys
  static diseaseDetection(imageHash: string): string {
    return `disease:detection:${imageHash}`;
  }

  static diseaseInfo(diseaseId: string): string {
    return `disease:info:${diseaseId}`;
  }

  // Expert consultation cache keys
  static expertsList(): string {
    return 'experts:list';
  }

  static expertProfile(expertId: string): string {
    return `expert:profile:${expertId}`;
  }

  static consultationHistory(userId: string): string {
    return `consultation:history:${userId}`;
  }

  // Notification cache keys
  static userNotifications(userId: string, unreadOnly?: boolean): string {
    return unreadOnly ? `notifications:${userId}:unread` : `notifications:${userId}`;
  }

  static notificationPreferences(userId: string): string {
    return `notifications:preferences:${userId}`;
  }

  // Rate limiting cache keys
  static rateLimit(identifier: string, endpoint: string): string {
    return `ratelimit:${identifier}:${endpoint}`;
  }

  static rateLimitWindow(identifier: string, endpoint: string, window: string): string {
    return `ratelimit:window:${identifier}:${endpoint}:${window}`;
  }

  // Session cache keys
  static userSession(sessionId: string): string {
    return `session:${sessionId}`;
  }

  static userSessions(userId: string): string {
    return `sessions:user:${userId}`;
  }

  // Temporary data cache keys
  static emailVerification(email: string): string {
    return `email:verification:${email}`;
  }

  static passwordReset(token: string): string {
    return `password:reset:${token}`;
  }

  static temporaryUpload(uploadId: string): string {
    return `upload:temp:${uploadId}`;
  }
}

// Cache service with business logic
export class CacheService {
  // User caching
  static async cacheUser(userId: string, userData: any, ttl: number = 3600): Promise<void> {
    await Promise.all([
      cache.set(CacheKeys.user(userId), userData, ttl),
      cache.set(CacheKeys.userProfile(userId), {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
        createdAt: userData.createdAt
      }, ttl)
    ]);
  }

  static async getUserFromCache(userId: string): Promise<any | null> {
    return await cache.get(CacheKeys.user(userId));
  }

  static async invalidateUserCache(userId: string): Promise<void> {
    await cache.del([
      CacheKeys.user(userId),
      CacheKeys.userProfile(userId),
      CacheKeys.userPreferences(userId),
      CacheKeys.dashboardAnalytics(userId)
    ]);
    
    // Invalidate user-related patterns
    await cache.deleteByPattern(`user:plants:${userId}*`);
    await cache.deleteByPattern(`user:sessions:${userId}*`);
    await cache.deleteByPattern(`analytics:user:${userId}*`);
  }

  // Plant caching
  static async cachePlant(plantId: string, plantData: any, ttl: number = 1800): Promise<void> {
    await cache.set(CacheKeys.plant(plantId), plantData, ttl);
  }

  static async getPlantFromCache(plantId: string): Promise<any | null> {
    return await cache.get(CacheKeys.plant(plantId));
  }

  static async invalidatePlantCache(plantId: string, userId?: string): Promise<void> {
    await cache.del([
      CacheKeys.plant(plantId),
      CacheKeys.plantDetails(plantId),
      CacheKeys.plantReminders(plantId)
    ]);

    // Invalidate plant-related patterns
    await cache.deleteByPattern(`plant:carelog:${plantId}*`);
    await cache.deleteByPattern(`plant:analytics:${plantId}*`);
    
    if (userId) {
      await cache.deleteByPattern(`user:plants:${userId}*`);
    }
  }

  // Search caching
  static async cacheSearchResults(
    query: string, 
    results: any[], 
    filters?: Record<string, any>,
    ttl: number = 600
  ): Promise<void> {
    const cacheKey = CacheKeys.search(query, filters);
    await cache.set(cacheKey, {
      query,
      results,
      filters,
      timestamp: new Date(),
      count: results.length
    }, ttl);
  }

  static async getSearchFromCache(
    query: string, 
    filters?: Record<string, any>
  ): Promise<any | null> {
    const cacheKey = CacheKeys.search(query, filters);
    return await cache.get(cacheKey);
  }

  static async cacheSearchSuggestions(
    query: string, 
    suggestions: string[],
    ttl: number = 3600
  ): Promise<void> {
    await cache.set(CacheKeys.searchSuggestions(query), suggestions, ttl);
  }

  static async invalidateSearchCache(patterns?: string[]): Promise<void> {
    const defaultPatterns = ['search:*', 'search:suggestions:*', 'search:popular'];
    const patternsToInvalidate = patterns || defaultPatterns;
    
    for (const pattern of patternsToInvalidate) {
      await cache.deleteByPattern(pattern);
    }
  }

  // Analytics caching
  static async cacheAnalytics(
    key: string, 
    data: any, 
    ttl: number = 1800
  ): Promise<void> {
    await cache.set(key, {
      data,
      generatedAt: new Date(),
      ttl
    }, ttl);
  }

  static async getAnalyticsFromCache(key: string): Promise<any | null> {
    const cached = await cache.get<{ data: any; generatedAt: Date; ttl: number }>(key);
    return cached ? cached.data : null;
  }

  static async invalidateAnalyticsCache(userId?: string): Promise<void> {
    if (userId) {
      await cache.deleteByPattern(`analytics:user:${userId}*`);
      await cache.del(CacheKeys.dashboardAnalytics(userId));
    } else {
      await cache.deleteByPattern('analytics:*');
    }
  }

  // Community caching
  static async cacheCommunityPosts(
    page: number,
    posts: any[],
    filters?: Record<string, any>,
    ttl: number = 300
  ): Promise<void> {
    const cacheKey = CacheKeys.communityPosts(page, filters);
    await cache.set(cacheKey, {
      posts,
      page,
      filters,
      timestamp: new Date()
    }, ttl);
  }

  static async getCommunityPostsFromCache(
    page: number,
    filters?: Record<string, any>
  ): Promise<any | null> {
    const cacheKey = CacheKeys.communityPosts(page, filters);
    return await cache.get(cacheKey);
  }

  static async invalidateCommunityCache(userId?: string): Promise<void> {
    await cache.deleteByPattern('community:posts:*');
    
    if (userId) {
      await cache.deleteByPattern(`community:posts:user:${userId}*`);
    }
  }

  // Weather caching
  static async cacheWeather(
    location: string,
    weatherData: any,
    ttl: number = 1800
  ): Promise<void> {
    await cache.set(CacheKeys.weather(location), {
      location,
      data: weatherData,
      cachedAt: new Date()
    }, ttl);
  }

  static async getWeatherFromCache(location: string): Promise<any | null> {
    const cached = await cache.get<{ location: string; data: any; cachedAt: Date }>(CacheKeys.weather(location));
    return cached ? cached.data : null;
  }

  static async cacheWeatherForecast(
    location: string,
    days: number,
    forecastData: any,
    ttl: number = 3600
  ): Promise<void> {
    await cache.set(CacheKeys.weatherForecast(location, days), {
      location,
      days,
      data: forecastData,
      cachedAt: new Date()
    }, ttl);
  }

  // Session caching
  static async cacheSession(
    sessionId: string,
    sessionData: any,
    ttl: number = 86400
  ): Promise<void> {
    await cache.set(CacheKeys.userSession(sessionId), sessionData, ttl);
    
    // Add to user's active sessions set
    if (sessionData.userId) {
      await cache.sadd(CacheKeys.userSessions(sessionData.userId), sessionId);
    }
  }

  static async getSessionFromCache(sessionId: string): Promise<any | null> {
    return await cache.get(CacheKeys.userSession(sessionId));
  }

  static async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    await cache.del(CacheKeys.userSession(sessionId));
    
    if (userId) {
      // Remove from user's active sessions set
      const userSessionsKey = CacheKeys.userSessions(userId);
      const sessions = await cache.smembers<string>(userSessionsKey);
      const filteredSessions = sessions.filter(s => s !== sessionId);
      
      await cache.del(userSessionsKey);
      if (filteredSessions.length > 0) {
        for (const session of filteredSessions) {
          await cache.sadd(userSessionsKey, session);
        }
      }
    }
  }

  // Notification caching
  static async cacheNotifications(
    userId: string,
    notifications: any[],
    unreadOnly: boolean = false,
    ttl: number = 600
  ): Promise<void> {
    const cacheKey = CacheKeys.userNotifications(userId, unreadOnly);
    await cache.set(cacheKey, {
      notifications,
      unreadOnly,
      cachedAt: new Date()
    }, ttl);
  }

  static async getNotificationsFromCache(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<any | null> {
    const cached = await cache.get<{ notifications: any[]; unreadOnly: boolean; cachedAt: Date }>(CacheKeys.userNotifications(userId, unreadOnly));
    return cached ? cached.notifications : null;
  }

  static async invalidateNotificationCache(userId: string): Promise<void> {
    await cache.del([
      CacheKeys.userNotifications(userId, false),
      CacheKeys.userNotifications(userId, true),
      CacheKeys.notificationPreferences(userId)
    ]);
  }

  // Generic cache operations with error handling
  static async safeGet<T>(key: string, fallbackValue: T | null = null): Promise<T | null> {
    try {
      const value = await cache.get<T>(key);
      return value !== null ? value : fallbackValue;
    } catch (error) {
      logger.error(`Cache GET error for key ${key}:`, error);
      return fallbackValue;
    }
  }

  static async safeSet<T>(
    key: string, 
    value: T, 
    ttl?: number, 
    tags?: string[]
  ): Promise<boolean> {
    try {
      const success = await cache.set(key, value, ttl);
      
      // Add tags if provided
      if (success && tags && tags.length > 0) {
        const { CacheTagManager } = await import('../middleware/cacheMiddleware');
        await CacheTagManager.tagKey(key, tags);
      }
      
      return success;
    } catch (error) {
      logger.error(`Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  static async safeDel(keys: string | string[]): Promise<number> {
    try {
      return await cache.del(keys);
    } catch (error) {
      logger.error(`Cache DEL error for key(s) ${keys}:`, error);
      return 0;
    }
  }

  // Bulk operations
  static async getMultiple<T>(keys: string[]): Promise<Array<T | null>> {
    try {
      const pipeline = keys.map(key => ({ method: 'get', args: [key] }));
      const results = await cache.pipeline(pipeline);
      
      return results.map(result => {
        try {
          return result ? JSON.parse(result) : null;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error(`Cache bulk GET error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  static async setMultiple<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
    tags?: string[]
  ): Promise<boolean[]> {
    try {
      const pipeline = entries.map(entry => ({
        method: 'setex',
        args: [entry.key, entry.ttl || 3600, JSON.stringify(entry.value)]
      }));
      
      const results = await cache.pipeline(pipeline);
      
      // Add tags if provided
      if (tags && tags.length > 0) {
        const { CacheTagManager } = await import('../middleware/cacheMiddleware');
        for (const entry of entries) {
          await CacheTagManager.tagKey(entry.key, tags);
        }
      }
      
      return results.map(result => result === 'OK');
    } catch (error) {
      logger.error(`Cache bulk SET error:`, error);
      return entries.map(() => false);
    }
  }
}

export default CacheService;