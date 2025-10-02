# Redis Caching System Documentation

## Overview

The AgroTrack backend implements a comprehensive Redis-based caching system to improve performance, reduce database load, and provide faster response times for frequently accessed data.

## Architecture

### Components

1. **RedisCache Class** (`src/config/redis.ts`)
   - Singleton Redis client wrapper
   - Connection management and health monitoring
   - Basic cache operations (get, set, del, exists, expire)
   - Advanced operations (hash, list, set, pipeline, transactions)
   - Statistics and monitoring

2. **CacheHelper Class** (`src/config/redis.ts`)
   - Common cache patterns implementation
   - Cache-aside pattern
   - Write-through pattern
   - Write-behind pattern
   - Refresh-ahead pattern

3. **CacheMiddleware** (`src/middleware/cacheMiddleware.ts`)
   - Express middleware for automatic request/response caching
   - Cache invalidation middleware
   - Tag-based cache management
   - Cache decorators for method-level caching

4. **CacheService** (`src/utils/cacheService.ts`)
   - Business logic specific cache operations
   - Cache key generators
   - Type-safe cache operations
   - Bulk operations

5. **CacheController** (`src/controllers/cacheController.ts`)
   - Admin API endpoints for cache management
   - Health monitoring and statistics
   - Cache clearing and warming operations

## Cache Key Strategy

### Key Naming Convention

All cache keys follow a hierarchical naming pattern:

```
{prefix}:{category}:{subcategory}:{identifier}:{modifier}
```

Examples:
- `agrotrack:user:profile:123`
- `agrotrack:plant:details:456`
- `agrotrack:search:universal:query_hash:user:123`
- `agrotrack:analytics:user:123:monthly`

### Key Categories

| Category | Pattern | TTL | Description |
|----------|---------|-----|-------------|
| User Data | `user:{userId}*` | 1h | User profiles, preferences, sessions |
| Plant Data | `plant:{plantId}*` | 15m | Plant details, care logs, analytics |
| Search Results | `search:*` | 5-10m | Search results, suggestions, facets |
| Analytics | `analytics:*` | 10-30m | Dashboard analytics, reports, metrics |
| Community | `community:*` | 5m | Posts, comments, user interactions |
| Weather | `weather:*` | 30m | Weather data and forecasts |
| Notifications | `notifications:{userId}*` | 10m | User notifications and preferences |
| Rate Limiting | `ratelimit:*` | Variable | Rate limiting counters and windows |

## Cache Patterns

### 1. Cache-Aside Pattern

Most common pattern where application manages cache:

```typescript
const data = await CacheHelper.getOrSet(
  CacheKeys.plant(plantId),
  async () => await Plant.findById(plantId),
  900 // 15 minutes TTL
);
```

### 2. Write-Through Pattern

Write to cache and database simultaneously:

```typescript
await CacheHelper.setAndPersist(
  CacheKeys.user(userId),
  userData,
  async (data) => await User.findByIdAndUpdate(userId, data),
  3600 // 1 hour TTL
);
```

### 3. Write-Behind Pattern

Write to cache immediately, persist asynchronously:

```typescript
await CacheHelper.setAndSchedulePersist(
  CacheKeys.userPreferences(userId),
  preferences,
  async (data) => await UserPreferences.updateOne({ userId }, data),
  7200 // 2 hours TTL
);
```

### 4. Refresh-Ahead Pattern

Proactively refresh cache before expiration:

```typescript
const data = await CacheHelper.refreshAhead(
  CacheKeys.weather(location),
  async () => await weatherAPI.getCurrentWeather(location),
  1800, // 30 minutes TTL
  0.8   // Refresh when 80% of TTL has passed
);
```

## Middleware Integration

### Response Caching

Automatically cache GET request responses:

```typescript
router.get('/plants/:id',
  authMiddleware,
  cacheMiddleware({
    ttl: 900, // 15 minutes
    keyGenerator: (req) => `plant:details:${req.params.id}`,
    varyBy: ['user-agent']
  }),
  PlantController.getPlantById
);
```

### Cache Invalidation

Automatically invalidate cache after mutations:

```typescript
router.put('/plants/:id',
  authMiddleware,
  invalidateCache((req) => [
    `plant:details:${req.params.id}`,
    `plants:user:${req.user.id}*`,
    `plants:analytics:user:${req.user.id}*`
  ]),
  PlantController.updatePlant
);
```

### Tag-Based Invalidation

Group related cache entries with tags:

```typescript
// Tag cache entries
await CacheTagManager.tagKey('plant:123', ['user_123_plants', 'plant_data']);

// Invalidate all entries with tag
await CacheTagManager.invalidateByTag('user_123_plants');
```

## Cache Warming

### Startup Warming

Pre-populate cache with frequently accessed data:

```typescript
CacheWarmer.addWarmupTask({
  name: 'Popular Search Terms',
  key: CacheKeys.popularSearches(),
  fetchFunction: async () => await getPopularSearchTerms(),
  ttl: 3600,
  interval: 1800000 // Refresh every 30 minutes
});

await CacheWarmer.warmCache();
```

### Periodic Refresh

Automatically refresh cache entries:

```typescript
CacheWarmer.startPeriodicWarmup();
```

## Monitoring and Management

### Health Monitoring

Check cache health and performance:

```typescript
GET /api/cache/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "connected": true,
    "stats": {
      "hits": 1250,
      "misses": 150,
      "totalRequests": 1400,
      "hitRate": 89.3,
      "lastReset": "2024-01-15T10:30:00Z"
    },
    "keyMetrics": {
      "totalKeys": 3421,
      "keysByPattern": {
        "route:*": 150,
        "user:*": 245,
        "plant:*": 890,
        "search:*": 120,
        "analytics:*": 67
      },
      "memoryUsage": "15.2M"
    }
  }
}
```

### Cache Management

Administrative endpoints for cache management:

```typescript
// Clear cache by pattern
DELETE /api/cache/clear/pattern/user:*

// Clear cache by type
DELETE /api/cache/clear/type/plants

// Flush all cache
DELETE /api/cache/flush

// Warm cache
POST /api/cache/warm

// Get key information
GET /api/cache/key/plant:details:123
```

## Performance Optimization

### TTL Strategy

| Data Type | TTL | Reasoning |
|-----------|-----|-----------|
| Static Reference Data | 4-24h | Rarely changes |
| User Profiles | 1h | Moderate change frequency |
| Plant Details | 15m | Can be updated frequently |
| Search Results | 5-10m | Fresh results preferred |
| Real-time Analytics | 1-5m | Near real-time requirements |
| Rate Limiting | 1-15m | Short-term tracking |

### Memory Management

1. **Key Expiration**: All keys have appropriate TTL values
2. **LRU Policy**: Redis configured with `allkeys-lru` eviction
3. **Memory Monitoring**: Track memory usage and key distribution
4. **Selective Caching**: Only cache frequently accessed data

### Connection Optimization

1. **Connection Pooling**: ioredis with connection pooling
2. **Pipeline Operations**: Batch multiple operations
3. **Lazy Connections**: Connect only when needed
4. **Graceful Degradation**: Continue operation if cache fails

## Configuration

### Environment Variables

```bash
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Configuration
REDIS_KEY_PREFIX=agrotrack:
REDIS_DEFAULT_TTL=3600

# Performance Settings
CACHE_WARM_ON_START=false
CACHE_PERIODIC_REFRESH=true
CACHE_METRICS_ENABLED=true
```

### Redis Configuration

Recommended Redis configuration:

```redis
# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (for production)
save 900 1
save 300 10
save 60 10000

# Network
tcp-keepalive 300
timeout 0

# Logging
loglevel notice
```

## Best Practices

### Do's

1. **Use appropriate TTLs** based on data volatility
2. **Implement graceful degradation** for cache failures
3. **Monitor cache hit rates** and adjust strategies
4. **Use consistent key naming** conventions
5. **Invalidate cache** after data mutations
6. **Batch operations** when possible
7. **Set memory limits** and eviction policies

### Don'ts

1. **Don't cache everything** - be selective
2. **Don't use very long TTLs** for dynamic data
3. **Don't ignore cache failures** - handle gracefully
4. **Don't forget to invalidate** related cache entries
5. **Don't cache large objects** unnecessarily
6. **Don't use cache for critical transactions**
7. **Don't forget to monitor** memory usage

## Error Handling

### Connection Failures

```typescript
try {
  const data = await cache.get(key);
  return data || await fetchFromDatabase();
} catch (error) {
  logger.error('Cache error:', error);
  return await fetchFromDatabase(); // Fallback to database
}
```

### Graceful Degradation

```typescript
const getCachedData = async (key: string, fetchFn: () => Promise<any>) => {
  if (!cache.isHealthy()) {
    return await fetchFn();
  }
  
  return await CacheHelper.getOrSet(key, fetchFn);
};
```

## Security Considerations

1. **Key Isolation**: Use user-specific prefixes
2. **Data Sanitization**: Don't cache sensitive data
3. **Access Control**: Restrict cache management endpoints
4. **Network Security**: Use Redis AUTH and encrypted connections
5. **Audit Logging**: Log cache management operations

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check key TTLs and implement eviction
2. **Low Hit Rate**: Review caching strategy and key patterns
3. **Connection Timeouts**: Adjust connection settings
4. **Stale Data**: Implement proper cache invalidation
5. **Performance Issues**: Use pipeline operations and optimize queries

### Debugging

```typescript
// Enable debug logging
logger.level = 'debug';

// Check cache statistics
const stats = await CacheMonitor.getHealthCheck();
console.log('Cache Stats:', stats);

// Monitor specific keys
const keyInfo = await cache.getKeyInfo('plant:details:123');
console.log('Key Info:', keyInfo);
```

This caching system provides a robust, scalable solution for improving AgroTrack's performance while maintaining data consistency and providing comprehensive monitoring capabilities.