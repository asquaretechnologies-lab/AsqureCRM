import { Router } from 'express';
import {
  getInstallations,
  createInstallation,
  updateInstallation,
} from '../controllers/installationController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('installations', 'VIEW'), getInstallations);
router.post('/', requirePermission('installations', 'CREATE'), createInstallation);
router.put('/:id', requirePermission('installations', 'EDIT'), updateInstallation);

export default router;
