import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createChangeOrderSchema, updateChangeOrderSchema } from '../utils/validation';
import {
  createChangeOrderHandler,
  listChangeOrdersHandler,
  getChangeOrderHandler,
  updateChangeOrderHandler,
  approveChangeOrderHandler,
  rejectChangeOrderHandler,
} from '../controllers/change-order.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createChangeOrderSchema), createChangeOrderHandler as any);
router.get('/', listChangeOrdersHandler as any);
router.get('/:id', getChangeOrderHandler as any);
router.patch('/:id', validate(updateChangeOrderSchema), updateChangeOrderHandler as any);
router.post('/:id/approve', approveChangeOrderHandler as any);
router.post('/:id/reject', rejectChangeOrderHandler as any);

export default router;
