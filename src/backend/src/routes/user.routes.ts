import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateUserSchema } from '../utils/validation';
import {
  getProfileHandler,
  updateProfileHandler,
  deleteAccountHandler,
} from '../controllers/user.controller';

const router = Router();

router.use(authenticate as any);

router.get('/me', getProfileHandler as any);
router.patch('/me', validate(updateUserSchema), updateProfileHandler as any);
router.delete('/me', deleteAccountHandler as any);

export default router;
