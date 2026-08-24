import { Router } from 'express';
import {
  getRoles,
  getPermissions,
  getRolePermissions,
  createRole,
  updateRolePermissions,
} from '../controllers/roleController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('roles', 'VIEW'), getRoles);
router.get('/permissions', requirePermission('roles', 'VIEW'), getPermissions);
router.get('/:roleId/permissions', requirePermission('roles', 'VIEW'), getRolePermissions);
router.post('/', requirePermission('roles', 'CREATE'), createRole);
router.put('/:roleId/permissions', requirePermission('roles', 'EDIT'), updateRolePermissions);

export default router;
