import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../utils/validation';
import {
  createProjectHandler,
  listProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from '../controllers/project.controller';

const router = Router();

router.use(authenticate as any);

router.post('/', validate(createProjectSchema), createProjectHandler as any);
router.get('/', listProjectsHandler as any);
router.get('/:id', getProjectHandler as any);
router.patch('/:id', validate(updateProjectSchema), updateProjectHandler as any);
router.delete('/:id', deleteProjectHandler as any);

export default router;
