/**
 * @swagger
 * components:
 *   schemas:
 *     SearchRequest:
 *       type: object
 *       properties:
 *         q:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           example: 'snake plant care'
 *           description: 'Search query string'
 *         types:
 *           type: array
 *           items:
 *             type: string
 *             enum: ['plants', 'posts', 'users', 'care-logs', 'experts']
 *           example: ['plants', 'posts']
 *           description: 'Content types to search in'
 *         filters:
 *           type: object
 *           properties:
 *             dateFrom:
 *               type: string
 *               format: date
 *               example: '2023-01-01'
 *               description: 'Filter results from this date'
 *             dateTo:
 *               type: string
 *               format: date
 *               example: '2023-12-31'
 *               description: 'Filter results until this date'
 *             location:
 *               type: string
 *               example: 'Living Room'
 *               description: 'Filter by location (for plants)'
 *             healthStatus:
 *               type: string
 *               enum: ['excellent', 'good', 'fair', 'poor']
 *               example: 'good'
 *               description: 'Filter by health status (for plants)'
 *             species:
 *               type: string
 *               example: 'Sansevieria trifasciata'
 *               description: 'Filter by plant species'
 *             careType:
 *               type: string
 *               enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-control', 'other']
 *               example: 'watering'
 *               description: 'Filter by care type (for care logs)'
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ['indoor-plants', 'beginner-friendly']
 *               description: 'Filter by tags (for posts)'
 *         sort:
 *           type: string
 *           enum: ['relevance', 'date:desc', 'date:asc', 'popularity:desc', 'name:asc', 'name:desc']
 *           default: 'relevance'
 *           example: 'relevance'
 *           description: 'Sort order for results'
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *           description: 'Page number for pagination'
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *           description: 'Number of results per page'
 * 
 *     SearchResult:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: ['plant', 'post', 'user', 'care-log', 'expert']
 *           example: 'plant'
 *           description: 'Type of search result'
 *         id:
 *           type: string
 *           example: '507f1f77bcf86cd799439012'
 *           description: 'ID of the result item'
 *         title:
 *           type: string
 *           example: 'My Snake Plant'
 *           description: 'Title or name of the result'
 *         description:
 *           type: string
 *           example: 'A beautiful snake plant in my living room'
 *           description: 'Description or excerpt of the result'
 *         image:
 *           type: string
 *           example: 'https://example.com/plant.jpg'
 *           description: 'Primary image URL'
 *         metadata:
 *           type: object
 *           description: 'Additional type-specific metadata'
 *           properties:
 *             species:
 *               type: string
 *               example: 'Sansevieria trifasciata'
 *             author:
 *               type: string
 *               example: 'John Doe'
 *             createdAt:
 *               type: string
 *               format: date-time
 *               example: '2023-12-01T10:00:00Z'
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *               example: ['indoor-plants', 'low-light']
 *         relevanceScore:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           example: 0.95
 *           description: 'Search relevance score (0-1)'
 *         url:
 *           type: string
 *           example: '/plants/507f1f77bcf86cd799439012'
 *           description: 'Relative URL to the result item'
 * 
 *     SearchResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: 'Search completed successfully'
 *         data:
 *           type: object
 *           properties:
 *             results:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *             pagination:
 *               $ref: '#/components/schemas/PaginationMeta'
 *             query:
 *               type: string
 *               example: 'snake plant care'
 *               description: 'Original search query'
 *             totalResults:
 *               type: number
 *               example: 42
 *               description: 'Total number of matching results'
 *             searchTime:
 *               type: number
 *               example: 0.15
 *               description: 'Search execution time in seconds'
 *             suggestions:
 *               type: array
 *               items:
 *                 type: string
 *               example: ['snake plant watering', 'snake plant propagation']
 *               description: 'Search query suggestions'
 *             facets:
 *               type: object
 *               description: 'Faceted search results for filtering'
 *               properties:
 *                 types:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   example:
 *                     plants: 15
 *                     posts: 8
 *                     care-logs: 12
 *                 species:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   example:
 *                     'Sansevieria trifasciata': 10
 *                     'Pothos aureus': 5
 *                 tags:
 *                   type: object
 *                   additionalProperties:
 *                     type: number
 *                   example:
 *                     'indoor-plants': 20
 *                     'beginner-friendly': 15
 * 
 *     SearchSuggestion:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           example: 'snake plant'
 *           description: 'Suggested search query'
 *         score:
 *           type: number
 *           example: 0.9
 *           description: 'Suggestion relevance score'
 *         category:
 *           type: string
 *           enum: ['plant', 'care', 'disease', 'general']
 *           example: 'plant'
 *           description: 'Category of the suggestion'
 * 
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Universal search
 *     description: Search across all content types (plants, posts, users, care logs, experts) with advanced filtering and faceted search
 *     parameters:
 *       - name: q
 *         in: query
 *         required: false
 *         description: Search query string
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *           example: 'snake plant care'
 *       - name: types
 *         in: query
 *         required: false
 *         description: Content types to search (comma-separated)
 *         schema:
 *           type: string
 *           example: 'plants,posts,users'
 *       - name: dateFrom
 *         in: query
 *         required: false
 *         description: Filter results from this date
 *         schema:
 *           type: string
 *           format: date
 *           example: '2023-01-01'
 *       - name: dateTo
 *         in: query
 *         required: false
 *         description: Filter results until this date
 *         schema:
 *           type: string
 *           format: date
 *           example: '2023-12-31'
 *       - name: location
 *         in: query
 *         required: false
 *         description: Filter by location (for plants)
 *         schema:
 *           type: string
 *           example: 'Living Room'
 *       - name: species
 *         in: query
 *         required: false
 *         description: Filter by plant species
 *         schema:
 *           type: string
 *           example: 'Sansevieria trifasciata'
 *       - name: healthStatus
 *         in: query
 *         required: false
 *         description: Filter by health status (for plants)
 *         schema:
 *           type: string
 *           enum: ['excellent', 'good', 'fair', 'poor']
 *           example: 'good'
 *       - name: careType
 *         in: query
 *         required: false
 *         description: Filter by care type (for care logs)
 *         schema:
 *           type: string
 *           enum: ['watering', 'fertilizing', 'pruning', 'repotting', 'pest-control', 'other']
 *           example: 'watering'
 *       - name: tags
 *         in: query
 *         required: false
 *         description: Filter by tags (comma-separated, for posts)
 *         schema:
 *           type: string
 *           example: 'indoor-plants,beginner-friendly'
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Sort order for results
 *         schema:
 *           type: string
 *           enum: ['relevance', 'date:desc', 'date:asc', 'popularity:desc', 'name:asc', 'name:desc']
 *           default: 'relevance'
 *           example: 'relevance'
 *       - $ref: '#/components/parameters/PageParam'
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of results per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 10
 *     responses:
 *       200:
 *         description: Search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SearchResponse'
 *             examples:
 *               successful_search:
 *                 summary: Successful search with results
 *                 value:
 *                   success: true
 *                   message: 'Search completed successfully'
 *                   data:
 *                     results:
 *                       - type: 'plant'
 *                         id: '507f1f77bcf86cd799439012'
 *                         title: 'My Snake Plant'
 *                         description: 'A beautiful snake plant in my living room'
 *                         image: 'https://example.com/plant.jpg'
 *                         metadata:
 *                           species: 'Sansevieria trifasciata'
 *                           author: 'John Doe'
 *                           createdAt: '2023-12-01T10:00:00Z'
 *                         relevanceScore: 0.95
 *                         url: '/plants/507f1f77bcf86cd799439012'
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 3
 *                       totalItems: 25
 *                       itemsPerPage: 10
 *                     query: 'snake plant care'
 *                     totalResults: 25
 *                     searchTime: 0.15
 *                     suggestions: ['snake plant watering', 'snake plant propagation']
 *                     facets:
 *                       types:
 *                         plants: 15
 *                         posts: 8
 *                         care-logs: 2
 *                       species:
 *                         'Sansevieria trifasciata': 10
 *                         'Pothos aureus': 3
 *               empty_results:
 *                 summary: Search with no results
 *                 value:
 *                   success: true
 *                   message: 'No results found for your search'
 *                   data:
 *                     results: []
 *                     pagination:
 *                       currentPage: 1
 *                       totalPages: 0
 *                       totalItems: 0
 *                       itemsPerPage: 10
 *                     query: 'very rare plant species'
 *                     totalResults: 0
 *                     searchTime: 0.05
 *                     suggestions: ['rare plants', 'exotic plants', 'uncommon species']
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Search rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: 'Too many search requests, please try again later'
 *               retryAfter: '1 minute'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /search/suggestions:
 *   get:
 *     tags: [Search]
 *     summary: Get search suggestions
 *     description: Get autocomplete suggestions for search queries based on popular searches and content
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Partial search query for suggestions
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: 'snake'
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of suggestions
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *           example: 5
 *       - name: category
 *         in: query
 *         required: false
 *         description: Filter suggestions by category
 *         schema:
 *           type: string
 *           enum: ['plant', 'care', 'disease', 'general']
 *           example: 'plant'
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
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
 *                   example: 'Suggestions retrieved successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SearchSuggestion'
 *                     query:
 *                       type: string
 *                       example: 'snake'
 *             example:
 *               success: true
 *               message: 'Suggestions retrieved successfully'
 *               data:
 *                 suggestions:
 *                   - query: 'snake plant'
 *                     score: 0.95
 *                     category: 'plant'
 *                   - query: 'snake plant care'
 *                     score: 0.88
 *                     category: 'care'
 *                   - query: 'snake plant watering'
 *                     score: 0.82
 *                     category: 'care'
 *                 query: 'snake'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 * /search/analytics:
 *   post:
 *     tags: [Search]
 *     summary: Track search analytics
 *     description: Record search query and results for analytics and improving search experience
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - resultsCount
 *             properties:
 *               query:
 *                 type: string
 *                 example: 'snake plant care'
 *                 description: 'Search query that was executed'
 *               resultsCount:
 *                 type: integer
 *                 minimum: 0
 *                 example: 25
 *                 description: 'Number of results returned'
 *               clickedResultId:
 *                 type: string
 *                 example: '507f1f77bcf86cd799439012'
 *                 description: 'ID of result that was clicked (optional)'
 *               clickedResultType:
 *                 type: string
 *                 enum: ['plant', 'post', 'user', 'care-log', 'expert']
 *                 example: 'plant'
 *                 description: 'Type of result that was clicked (optional)'
 *               searchTime:
 *                 type: number
 *                 minimum: 0
 *                 example: 0.15
 *                 description: 'Search execution time in seconds'
 *     responses:
 *       200:
 *         description: Analytics recorded successfully
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
 *                   example: 'Search analytics recorded successfully'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */