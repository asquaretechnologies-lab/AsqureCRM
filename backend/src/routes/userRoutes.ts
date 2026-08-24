import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
} from '../controllers/userController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('users', 'VIEW'), getUsers);
router.get('/:id', requirePermission('users', 'VIEW'), getUserById);
router.post('/', requirePermission('users', 'CREATE'), createUser);
router.put('/:id', requirePermission('users', 'EDIT'), updateUser);
router.post('/:id/reset-password', requirePermission('users', 'EDIT'), resetUserPassword);

export default router;
