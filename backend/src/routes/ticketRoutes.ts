import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  addTicketComment,
} from '../controllers/ticketController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('tickets', 'VIEW'), getTickets);
router.get('/:id', requirePermission('tickets', 'VIEW'), getTicketById);
router.post('/', requirePermission('tickets', 'CREATE'), createTicket);
router.put('/:id', requirePermission('tickets', 'EDIT'), updateTicket);
router.post('/:id/comments', requirePermission('tickets', 'EDIT'), addTicketComment);

export default router;
