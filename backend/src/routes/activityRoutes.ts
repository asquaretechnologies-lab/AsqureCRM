import { Router } from 'express';
import { getActivities, createActivity } from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getActivities);
router.post('/', createActivity);

export default router;
