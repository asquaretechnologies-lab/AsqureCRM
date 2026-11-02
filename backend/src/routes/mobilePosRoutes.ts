import { Router } from 'express';
import {
  registerMobilePos,
  checkMobileEmail,
  verifyMobileOtp,
} from '../controllers/mobilePosController';

const router = Router();

// Public endpoints for offline Mobile POS onboarding
// 1. Check if email is registered (sends OTP if registered)
router.post('/check-email', checkMobileEmail);
// 2. Verify OTP and fetch customer/outlet/license details
router.post('/verify-otp', verifyMobileOtp);
// 3. Register a new mobile POS customer
router.post('/register', registerMobilePos);

export default router;
