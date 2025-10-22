import { Router } from 'express';
import { CareLogController } from '../controllers/careLogController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', CareLogController.createCareLog);
router.get('/', CareLogController.getCareLogs);
router.get('/:id', CareLogController.getCareLogById);
router.put('/:id', CareLogController.updateCareLog);
router.delete('/:id', CareLogController.deleteCareLog);

export default router;
