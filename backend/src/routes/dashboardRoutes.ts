import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getManagementDashboard,
  getSalesDashboard,
  getAccountsDashboard,
  getSupportDashboard,
} from '../controllers/dashboardController';

const router = Router();

router.use(authenticateToken);

router.get('/management', getManagementDashboard);
router.get('/sales', getSalesDashboard);
router.get('/accounts', getAccountsDashboard);
router.get('/support', getSupportDashboard);

export default router;
