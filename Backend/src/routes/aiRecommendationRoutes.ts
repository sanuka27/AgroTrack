import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import AIRecommendationController from '../controllers/aiRecommendationController';

const router = express.Router();

// GET /api/ai-recommendations?plantId=&limit=
router.get('/', authMiddleware, AIRecommendationController.getRecommendations);

// GET /api/ai-recommendations/:id
router.get('/:id', authMiddleware, AIRecommendationController.getRecommendationById);

// POST /api/ai-recommendations/plant-care
// Get AI-powered care recommendations for a plant
router.post('/plant-care', authMiddleware, AIRecommendationController.getPlantCareRecommendations);

// POST /api/ai-recommendations/save
// Save AI analysis results to history
router.post('/save', authMiddleware, AIRecommendationController.saveAnalysis);

export default router;
