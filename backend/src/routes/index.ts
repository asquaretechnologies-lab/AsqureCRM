import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import roleRoutes from './roleRoutes';
import customerRoutes from './customerRoutes';
import productRoutes from './productRoutes';
import installationRoutes from './installationRoutes';
import licenseRoutes from './licenseRoutes';
import renewalRoutes from './renewalRoutes';
import invoiceRoutes from './invoiceRoutes';
import paymentRoutes from './paymentRoutes';
import leadRoutes from './leadRoutes';
import activityRoutes from './activityRoutes';
import ticketRoutes from './ticketRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportRoutes from './reportRoutes';
import notificationRoutes from './notificationRoutes';
import companyAccountsRoutes from './companyAccountsRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'POS CRM API Service is operational',
    timestamp: new Date().toISOString(),
  });
});

// Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/installations', installationRoutes);
router.use('/licenses', licenseRoutes);
router.use('/renewals', renewalRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/leads', leadRoutes);
router.use('/activities', activityRoutes);
router.use('/tickets', ticketRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/company-accounts', companyAccountsRoutes);

export default router;
