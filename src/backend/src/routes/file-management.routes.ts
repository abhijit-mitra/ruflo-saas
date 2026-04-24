import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createFolderSchema, renameFolderSchema, moveFileSchema } from '../utils/validation';
import {
  listContentsHandler,
  createFolderHandler,
  renameFolderHandler,
  deleteFolderHandler,
  uploadFileHandler,
  deleteFileHandler,
  moveFileHandler,
} from '../controllers/file-management.controller';

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

router.get('/', listContentsHandler as any);
router.post('/folders', validate(createFolderSchema), createFolderHandler as any);
router.patch('/folders/:folderId', validate(renameFolderSchema), renameFolderHandler as any);
router.delete('/folders/:folderId', deleteFolderHandler as any);
router.post('/upload', upload.single('file'), uploadFileHandler as any);
router.delete('/:fileId', deleteFileHandler as any);
router.patch('/:fileId/move', validate(moveFileSchema), moveFileHandler as any);

export default router;
