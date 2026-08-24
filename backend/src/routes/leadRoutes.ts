import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  convertLeadToCustomer,
} from '../controllers/leadController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('leads', 'VIEW'), getLeads);
router.get('/:id', requirePermission('leads', 'VIEW'), getLeadById);
router.post('/', requirePermission('leads', 'CREATE'), createLead);
router.put('/:id', requirePermission('leads', 'EDIT'), updateLead);
router.post('/:id/convert', requirePermission('leads', 'EDIT'), convertLeadToCustomer);

export default router;
