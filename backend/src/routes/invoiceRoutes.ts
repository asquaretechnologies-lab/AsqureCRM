import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  getOutstanding,
} from '../controllers/invoiceController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('invoices', 'VIEW'), getInvoices);
router.get('/outstanding', requirePermission('invoices', 'VIEW'), getOutstanding);
router.get('/:id', requirePermission('invoices', 'VIEW'), getInvoiceById);
router.post('/', requirePermission('invoices', 'CREATE'), createInvoice);

export default router;
