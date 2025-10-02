import express from 'express';
import { CacheController } from '../controllers/cacheController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cache
 *   description: Cache management and monitoring endpoints
 */

/**
 * @swagger
 * /api/cache/health:
 *   get:
 *     summary: Get cache health status and statistics
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, degraded, unhealthy]
 *                     connected:
 *                       type: boolean
 *                     stats:
 *                       type: object
 *                       properties:
 *                         hits:
 *                           type: number
 *                         misses:
 *                           type: number
 *                         totalRequests:
 *                           type: number
 *                         hitRate:
 *                           type: number
 *                         lastReset:
 *                           type: string
 *                           format: date-time
 *                     keyMetrics:
 *                       type: object
 *                       properties:
 *                         totalKeys:
 *                           type: number
 *                         keysByPattern:
 *                           type: object
 *                         memoryUsage:
 *                           type: string
 */
router.get('/health', authMiddleware, roleGuard(['admin']), CacheController.getHealth);

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get detailed cache statistics
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                     keys:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/stats', authMiddleware, roleGuard(['admin']), CacheController.getStats);

/**
 * @swagger
 * /api/cache/clear/pattern/{pattern}:
 *   delete:
 *     summary: Clear cache entries by pattern
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pattern
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key pattern (supports wildcards)
 *         example: "user:*"
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirm:
 *                 type: boolean
 *                 description: Set to true to actually delete, false for preview
 *                 default: false
 *     responses:
 *       200:
 *         description: Cache clearing result or preview
 */
router.delete('/clear/pattern/:pattern', authMiddleware, roleGuard(['admin']), CacheController.clearByPattern);

/**
 * @swagger
 * /api/cache/clear/tags:
 *   delete:
 *     summary: Clear cache entries by tags
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of cache tags to invalidate
 *                 example: ["user_data", "analytics"]
 *               confirm:
 *                 type: boolean
 *                 description: Set to true to actually delete, false for preview
 *                 default: false
 *     responses:
 *       200:
 *         description: Cache clearing result or preview
 */
router.delete('/clear/tags', authMiddleware, roleGuard(['admin']), CacheController.clearByTags);

/**
 * @swagger
 * /api/cache/clear/type/{type}:
 *   delete:
 *     summary: Clear cache entries by type
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [user, search, analytics, community, weather, plants]
 *         description: Type of cache to clear
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Specific user ID (required for user type)
 *               confirm:
 *                 type: boolean
 *                 description: Set to true to actually delete, false for preview
 *                 default: false
 *     responses:
 *       200:
 *         description: Cache clearing result or preview
 */
router.delete('/clear/type/:type', authMiddleware, roleGuard(['admin']), CacheController.clearByType);

/**
 * @swagger
 * /api/cache/flush:
 *   delete:
 *     summary: Flush all cache entries
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               confirm:
 *                 type: boolean
 *                 description: Must be true to flush all cache
 *                 example: true
 *             required:
 *               - confirm
 *     responses:
 *       200:
 *         description: Cache flush result or preview
 *       400:
 *         description: Confirmation required
 */
router.delete('/flush', authMiddleware, roleGuard(['admin']), CacheController.flushAll);

/**
 * @swagger
 * /api/cache/warm:
 *   post:
 *     summary: Warm cache with common data
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache warming completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 */
router.post('/warm', authMiddleware, roleGuard(['admin']), CacheController.warmCache);

/**
 * @swagger
 * /api/cache/key/{key}:
 *   get:
 *     summary: Get information about a specific cache key
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to inspect
 *       - in: query
 *         name: include_value
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include the actual cached value
 *     responses:
 *       200:
 *         description: Cache key information
 *       404:
 *         description: Cache key not found
 */
router.get('/key/:key', authMiddleware, roleGuard(['admin']), CacheController.getKeyInfo);

/**
 * @swagger
 * /api/cache/key/{key}:
 *   put:
 *     summary: Set a cache key value
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to set
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 description: Value to cache
 *               ttl:
 *                 type: number
 *                 description: Time to live in seconds
 *             required:
 *               - value
 *     responses:
 *       200:
 *         description: Cache key set successfully
 *       400:
 *         description: Invalid request
 */
router.put('/key/:key', authMiddleware, roleGuard(['admin']), CacheController.setKey);

/**
 * @swagger
 * /api/cache/key/{key}:
 *   delete:
 *     summary: Delete a specific cache key
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to delete
 *     responses:
 *       200:
 *         description: Cache key deletion result
 */
router.delete('/key/:key', authMiddleware, roleGuard(['admin']), CacheController.deleteKey);

/**
 * @swagger
 * /api/cache/stats/reset:
 *   post:
 *     summary: Reset cache statistics
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics reset successfully
 */
router.post('/stats/reset', authMiddleware, roleGuard(['admin']), CacheController.resetStats);

export default router;