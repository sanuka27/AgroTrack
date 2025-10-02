/**
 * @swagger
 * components:
 *   schemas:
 *     PlantCreate:
 *       type: object
 *       required:
 *         - name
 *         - species
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: 'My Snake Plant'
 *           description: 'Personal name for the plant'
 *         species:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: 'Sansevieria trifasciata'
 *           description: 'Scientific species name'
 *         commonName:
 *           type: string
 *           maxLength: 100
 *           example: 'Snake Plant'
 *           description: 'Common name of the plant'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'A beautiful snake plant in my living room window'
 *           description: 'Personal description or notes about the plant'
 *         plantedDate:
 *           type: string
 *           format: date
 *           example: '2023-06-15'
 *           description: 'Date when the plant was acquired or planted'
 *         location:
 *           type: string
 *           maxLength: 100
 *           example: 'Living Room Window'
 *           description: 'Location where the plant is kept'
 *         careInstructions:
 *           type: object
 *           description: 'Care instructions for different plant care activities'
 *           properties:
 *             watering:
 *               type: object
 *               properties:
 *                 frequency:
 *                   type: string
 *                   example: 'weekly'
 *                 amount:
 *                   type: string
 *                   example: '200ml'
 *                 notes:
 *                   type: string
 *                   example: 'Water when soil is dry'
 *             fertilizing:
 *               type: object
 *               properties:
 *                 frequency:
 *                   type: string
 *                   example: 'monthly'
 *                 type:
 *                   type: string
 *                   example: 'liquid fertilizer'
 *                 notes:
 *                   type: string
 *                   example: 'Use diluted liquid fertilizer'
 *         healthStatus:
 *           type: string
 *           enum: ['excellent', 'good', 'fair', 'poor']
 *           default: 'good'
 *           example: 'good'
 *           description: 'Current health status of the plant'
 * 
 *     PlantUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: 'My Updated Snake Plant'
 *         species:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: 'Sansevieria trifasciata'
 *         commonName:
 *           type: string
 *           maxLength: 100
 *           example: 'Snake Plant'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'Updated description of my snake plant'
 *         location:
 *           type: string
 *           maxLength: 100
 *           example: 'New location - Bedroom'
 *         careInstructions:
 *           type: object
 *           description: 'Updated care instructions'
 *         healthStatus:
 *           type: string
 *           enum: ['excellent', 'good', 'fair', 'poor']
 *           example: 'excellent'
 * 
 *     PlantResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/Plant'
 *         - type: object
 *           properties:
 *             careHistory:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CareLog'
 *               description: 'Recent care history for the plant'
 *             upcomingReminders:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reminder'
 *               description: 'Upcoming care reminders'
 * 
 *     PlantListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Plants retrieved successfully'
 *         data:
 *           type: object
 *           properties:
 *             plants:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Plant'
 *             pagination:
 *               $ref: '#/components/schemas/PaginationMeta'
 * 
 * /plants:
 *   get:
 *     tags: [Plants]
 *     summary: Get user's plants
 *     description: Retrieve a paginated list of plants belonging to the authenticated user
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - name: species
 *         in: query
 *         description: Filter by plant species
 *         required: false
 *         schema:
 *           type: string
 *           example: 'Sansevieria trifasciata'
 *       - name: healthStatus
 *         in: query
 *         description: Filter by health status
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['excellent', 'good', 'fair', 'poor']
 *           example: 'good'
 *       - name: location
 *         in: query
 *         description: Filter by location
 *         required: false
 *         schema:
 *           type: string
 *           example: 'Living Room'
 *       - name: sort
 *         in: query
 *         description: Sort plants by field
 *         required: false
 *         schema:
 *           type: string
 *           enum: ['name:asc', 'name:desc', 'createdAt:asc', 'createdAt:desc', 'plantedDate:asc', 'plantedDate:desc']
 *           default: 'createdAt:desc'
 *           example: 'name:asc'
 *     responses:
 *       200:
 *         description: Plants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlantListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   post:
 *     tags: [Plants]
 *     summary: Create a new plant
 *     description: Add a new plant to the user's collection
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlantCreate'
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/PlantCreate'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: 'Plant images (max 5 files, 10MB each)'
 *     responses:
 *       201:
 *         description: Plant created successfully
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
 *                   example: 'Plant created successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     plant:
 *                       $ref: '#/components/schemas/Plant'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /plants/{plantId}:
 *   get:
 *     tags: [Plants]
 *     summary: Get plant details
 *     description: Retrieve detailed information about a specific plant including care history
 *     parameters:
 *       - name: plantId
 *         in: path
 *         required: true
 *         description: Plant ID
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439012'
 *       - name: includeCareHistory
 *         in: query
 *         description: Include recent care history
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *       - name: includeReminders
 *         in: query
 *         description: Include upcoming reminders  
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Plant details retrieved successfully
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
 *                   example: 'Plant details retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     plant:
 *                       $ref: '#/components/schemas/PlantResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   put:
 *     tags: [Plants]
 *     summary: Update plant
 *     description: Update plant information and care instructions
 *     parameters:
 *       - name: plantId
 *         in: path
 *         required: true
 *         description: Plant ID
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439012'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlantUpdate'
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/PlantUpdate'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: 'New plant images (replaces existing)'
 *     responses:
 *       200:
 *         description: Plant updated successfully
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
 *                   example: 'Plant updated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     plant:
 *                       $ref: '#/components/schemas/Plant'
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
 *     tags: [Plants]
 *     summary: Delete plant
 *     description: Remove a plant from the user's collection (also removes related care logs and reminders)
 *     parameters:
 *       - name: plantId
 *         in: path
 *         required: true
 *         description: Plant ID
 *         schema:
 *           type: string
 *           example: '507f1f77bcf86cd799439012'
 *     responses:
 *       200:
 *         description: Plant deleted successfully
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
 *                   example: 'Plant deleted successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedPlant:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: '507f1f77bcf86cd799439012'
 *                         name:
 *                           type: string
 *                           example: 'My Snake Plant'
 *                     relatedDataDeleted:
 *                       type: object
 *                       properties:
 *                         careLogsDeleted:
 *                           type: number
 *                           example: 15
 *                         remindersDeleted:
 *                           type: number
 *                           example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */