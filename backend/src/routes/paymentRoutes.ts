import { Router } from 'express';
import { getPayments, createPayment } from '../controllers/paymentController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('payments', 'VIEW'), getPayments);
router.post('/', requirePermission('payments', 'CREATE'), createPayment);

export default router;
