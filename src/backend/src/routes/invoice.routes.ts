import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, recordPaymentSchema } from '../utils/validation';
import {
  createInvoiceHandler,
  listInvoicesHandler,
  getInvoiceHandler,
  updateInvoiceHandler,
  sendInvoiceHandler,
  payInvoiceHandler,
} from '../controllers/invoice.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createInvoiceSchema), createInvoiceHandler as any);
router.get('/', listInvoicesHandler as any);
router.get('/:id', getInvoiceHandler as any);
router.patch('/:id', validate(updateInvoiceSchema), updateInvoiceHandler as any);
router.post('/:id/send', sendInvoiceHandler as any);
router.post('/:id/pay', validate(recordPaymentSchema), payInvoiceHandler as any);

export default router;
