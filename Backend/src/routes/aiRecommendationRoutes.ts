import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import AIRecommendationController from '../controllers/aiRecommendationController';

const router = express.Router();

// GET /api/ai-recommendations?plantId=&limit=
router.get('/', authMiddleware, AIRecommendationController.getRecommendations);

// POST /api/ai-recommendations/plant-care
// Get AI-powered care recommendations for a plant
router.post('/plant-care', authMiddleware, AIRecommendationController.getPlantCareRecommendations);

export default router;
