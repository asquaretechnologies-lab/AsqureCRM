import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  generateAutomatedNotifications,
} from '../controllers/notificationController';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.post('/generate', generateAutomatedNotifications);

export default router;
