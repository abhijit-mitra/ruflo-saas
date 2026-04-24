import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createBOMSchema,
  updateBOMSchema,
  createBOMProductSchema,
  updateBOMProductSchema,
} from '../utils/validation';
import {
  createBOMHandler,
  listBOMsHandler,
  getBOMHandler,
  updateBOMHandler,
  deleteBOMHandler,
  addProductHandler,
  updateProductHandler,
  deleteProductHandler,
  importBOMHandler,
} from '../controllers/bom.controller';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router({ mergeParams: true });

router.use(authenticate as any);

router.post('/', validate(createBOMSchema), createBOMHandler as any);
router.get('/', listBOMsHandler as any);
router.get('/:bomId', getBOMHandler as any);
router.patch('/:bomId', validate(updateBOMSchema), updateBOMHandler as any);
router.delete('/:bomId', deleteBOMHandler as any);
router.post('/:bomId/products', validate(createBOMProductSchema), addProductHandler as any);
router.patch('/:bomId/products/:productId', validate(updateBOMProductSchema), updateProductHandler as any);
router.delete('/:bomId/products/:productId', deleteProductHandler as any);
router.post('/:bomId/import', upload.single('file'), importBOMHandler as any);

export default router;
