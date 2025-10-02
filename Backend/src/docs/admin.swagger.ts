/**
 * @swagger
 * components:
 *   schemas:
 *     AdminDashboard:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: number
 *           example: 1250
 *         activeUsers:
 *           type: number
 *           example: 980
 *         newUsersThisMonth:
 *           type: number
 *           example: 125
 *         totalPlants:
 *           type: number
 *           example: 3500
 *         totalPosts:
 *           type: number
 *           example: 850
 *         totalCareLog:
 *           type: number
 *           example: 15000
 *         systemHealth:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: ['healthy', 'warning', 'critical']
 *               example: 'healthy'
 *             database:
 *               type: string
 *               enum: ['connected', 'disconnected', 'slow']
 *               example: 'connected'
 *             memory:
 *               type: object
 *               properties:
 *                 used:
 *                   type: number
 *                   example: 512
 *                 total:
 *                   type: number
 *                   example: 2048
 *                 percentage:
 *                   type: number
 *                   example: 25
 * 
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard data
 *     description: Retrieve comprehensive system statistics and health metrics for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Dashboard data retrieved successfully'
 *                 data:
 *                   $ref: '#/components/schemas/AdminDashboard'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Admin access required'
 *               error: 'You must be an admin to access this resource'
 *       429:
 *         description: Admin rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Too many admin requests, please try again later'
 *               retryAfter: '15 minutes'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users (Admin only)
 *     description: Retrieve a paginated list of all users with filtering and search capabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: role
 *         in: query
 *         description: Filter by user role
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['user', 'moderator', 'admin', 'super_admin']
 *           example: 'user'
 *       - name: status
 *         in: query
 *         description: Filter by account status
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['active', 'inactive', 'suspended']
 *           example: 'active'
 *       - name: sortBy
 *         in: query
 *         description: Field to sort by
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['createdAt', 'lastActiveAt', 'name', 'email']
 *           default: 'createdAt'
 *           example: 'createdAt'
 *       - name: sortOrder
 *         in: query
 *         description: Sort order
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['asc', 'desc']
 *           default: 'desc'
 *           example: 'desc'
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Users retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/User'
 *                           - type: object
 *                             properties:
 *                               status:
 *                                 type: string
 *                                 enum: ['active', 'inactive', 'suspended']
 *                                 example: 'active'
 *                               plantsCount:
 *                                 type: number
 *                                 example: 15
 *                               postsCount:
 *                                 type: number
 *                                 example: 8
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /admin/users/{userId}:
 *   put:
 *     tags: [Admin]
 *     summary: Update user (Admin only)
 *     description: Update user information, role, or status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID to update
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439011'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Updated Name'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: 'updated@example.com'
 *               role:
 *                 type: string
 *                 enum: ['user', 'moderator', 'admin', 'super_admin']
 *                 example: 'moderator'
 *               status:
 *                 type: string
 *                 enum: ['active', 'inactive', 'suspended']
 *                 example: 'active'
 *               bio:
 *                 type: string
 *                 example: 'Updated bio information'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'User updated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user (Admin only)
 *     description: Delete a user account and optionally their associated data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: User ID to delete
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439011'
 *       - name: deleteData
 *         in: query
 *         description: Whether to delete user's associated data (plants, posts, etc.)
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *           example: true
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'User deleted successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedUser:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: '507f1f77bcf86cd799439011'
 *                         email:
 *                           type: string
 *                           example: 'deleted@example.com'
 *                     dataDeleted:
 *                       type: object
 *                       properties:
 *                         plants:
 *                           type: number
 *                           example: 15
 *                         posts:
 *                           type: number
 *                           example: 8
 *                         careLogs:
 *                           type: number
 *                           example: 120
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */