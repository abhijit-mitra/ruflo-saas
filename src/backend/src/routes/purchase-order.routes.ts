import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createPurchaseOrderSchema, updatePurchaseOrderSchema } from '../utils/validation';
import {
  createPurchaseOrderHandler,
  listPurchaseOrdersHandler,
  getPurchaseOrderHandler,
  updatePurchaseOrderHandler,
  sendPurchaseOrderHandler,
} from '../controllers/purchase-order.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createPurchaseOrderSchema), createPurchaseOrderHandler as any);
router.get('/', listPurchaseOrdersHandler as any);
router.get('/:id', getPurchaseOrderHandler as any);
router.patch('/:id', validate(updatePurchaseOrderSchema), updatePurchaseOrderHandler as any);
router.post('/:id/send', sendPurchaseOrderHandler as any);

export default router;
