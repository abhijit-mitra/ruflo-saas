import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createSalesOrderSchema, updateSalesOrderSchema } from '../utils/validation';
import {
  createSalesOrderHandler,
  listSalesOrdersHandler,
  getSalesOrderHandler,
  updateSalesOrderHandler,
  confirmSalesOrderHandler,
} from '../controllers/sales-order.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createSalesOrderSchema), createSalesOrderHandler as any);
router.get('/', listSalesOrdersHandler as any);
router.get('/:id', getSalesOrderHandler as any);
router.patch('/:id', validate(updateSalesOrderSchema), updateSalesOrderHandler as any);
router.post('/:id/confirm', confirmSalesOrderHandler as any);

export default router;
