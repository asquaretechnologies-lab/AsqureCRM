import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCustomerReport,
  getInstallationReport,
  getLicenseReport,
  getFinanceReport,
  getSalesReport,
  getSupportReport,
} from '../controllers/reportController';

const router = Router();

router.use(authenticateToken);

router.get('/customer', getCustomerReport);
router.get('/installation', getInstallationReport);
router.get('/license', getLicenseReport);
router.get('/finance', getFinanceReport);
router.get('/sales', getSalesReport);
router.get('/support', getSupportReport);

export default router;
