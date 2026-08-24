import { Router } from 'express';
import {
  getCustomers,
  getCustomer360,
  createCustomer,
  updateCustomer,
} from '../controllers/customerController';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contactController';
import {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from '../controllers/outletController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Customer endpoints
router.get('/', requirePermission('customers', 'VIEW'), getCustomers);
router.get('/:id/360', requirePermission('customers', 'VIEW'), getCustomer360);
router.post('/', requirePermission('customers', 'CREATE'), createCustomer);
router.put('/:id', requirePermission('customers', 'EDIT'), updateCustomer);

// Contact endpoints
router.get('/contacts/all', requirePermission('contacts', 'VIEW'), getContacts);
router.post('/contacts', requirePermission('contacts', 'CREATE'), createContact);
router.put('/contacts/:id', requirePermission('contacts', 'EDIT'), updateContact);
router.delete('/contacts/:id', requirePermission('contacts', 'DELETE'), deleteContact);

// Outlet endpoints
router.get('/outlets/all', requirePermission('outlets', 'VIEW'), getOutlets);
router.post('/outlets', requirePermission('outlets', 'CREATE'), createOutlet);
router.put('/outlets/:id', requirePermission('outlets', 'EDIT'), updateOutlet);
router.delete('/outlets/:id', requirePermission('outlets', 'DELETE'), deleteOutlet);

export default router;
