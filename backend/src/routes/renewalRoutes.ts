import { Router } from 'express';
import { getRenewals, renewLicense } from '../controllers/renewalController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('renewals', 'VIEW'), getRenewals);
router.post('/', requirePermission('renewals', 'CREATE'), renewLicense);

export default router;
