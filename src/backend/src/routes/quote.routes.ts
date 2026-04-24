import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createQuoteSchema, updateQuoteSchema } from '../utils/validation';
import {
  createQuoteHandler,
  listQuotesHandler,
  getQuoteHandler,
  updateQuoteHandler,
  submitQuoteHandler,
  winQuoteHandler,
  loseQuoteHandler,
  reviseQuoteHandler,
} from '../controllers/quote.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createQuoteSchema), createQuoteHandler as any);
router.get('/', listQuotesHandler as any);
router.get('/:id', getQuoteHandler as any);
router.patch('/:id', validate(updateQuoteSchema), updateQuoteHandler as any);
router.post('/:id/submit', submitQuoteHandler as any);
router.post('/:id/win', winQuoteHandler as any);
router.post('/:id/lose', loseQuoteHandler as any);
router.post('/:id/revise', reviseQuoteHandler as any);

export default router;
