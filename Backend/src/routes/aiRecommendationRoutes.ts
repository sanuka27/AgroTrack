import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import AIRecommendationController from '../controllers/aiRecommendationController';

const router = express.Router();

// GET /api/ai-recommendations?plantId=&limit=
router.get('/', authMiddleware, AIRecommendationController.getRecommendations);

export default router;
