import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  createProductPlan,
  updateProductPlan,
} from '../controllers/productController';
import { authenticateToken, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', requirePermission('products', 'VIEW'), getProducts);
router.post('/', requirePermission('products', 'CREATE'), createProduct);
router.put('/:id', requirePermission('products', 'EDIT'), updateProduct);
router.post('/plans', requirePermission('plans', 'CREATE'), createProductPlan);
router.put('/plans/:planId', requirePermission('plans', 'EDIT'), updateProductPlan);

export default router;
