import { Router } from 'express';
import { registerMobilePos } from '../controllers/mobilePosController';

const router = Router();

// Public registration endpoint for offline Mobile POS onboarding
router.post('/register', registerMobilePos);

export default router;
