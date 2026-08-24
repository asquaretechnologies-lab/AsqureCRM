import { Router } from 'express';
import {
  getLicenses,
  issueLicense,
  validateLicense,
  updateLicenseStatus,
} from '../controllers/licenseController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

// Public / Client validation endpoint
router.post('/validate', validateLicense);

// Protected endpoints
router.use(authenticateToken);

router.get('/', requirePermission('licenses', 'VIEW'), getLicenses);
router.post('/', requirePermission('licenses', 'CREATE'), issueLicense);
router.put('/:id/status', requirePermission('licenses', 'EDIT'), updateLicenseStatus);

export default router;
