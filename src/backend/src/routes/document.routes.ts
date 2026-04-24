import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createDocumentSchema } from '../utils/validation';
import {
  createDocumentHandler,
  listDocumentsHandler,
  deleteDocumentHandler,
} from '../controllers/document.controller';

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createDocumentSchema), createDocumentHandler as any);
router.get('/', listDocumentsHandler as any);
router.delete('/:id', deleteDocumentHandler as any);

export default router;
