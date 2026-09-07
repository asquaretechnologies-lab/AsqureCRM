import { Router } from 'express';
import { getPayments, createPayment, deletePayment } from '../controllers/paymentController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('payments', 'VIEW'), getPayments);
router.post('/', requirePermission('payments', 'CREATE'), createPayment);
router.delete('/:id', deletePayment);

export default router;

