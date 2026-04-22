import { Router } from 'express';
import { OrgRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
} from '../utils/validation';
import {
  createOrgHandler,
  getOrgHandler,
  updateOrgHandler,
  inviteMemberHandler,
  getMembersHandler,
  updateMemberRoleHandler,
  removeMemberHandler,
} from '../controllers/org.controller';

const router = Router();

router.use(authenticate as any);

const allRoles: OrgRole[] = [OrgRole.owner, OrgRole.admin, OrgRole.member];
const adminRoles: OrgRole[] = [OrgRole.owner, OrgRole.admin];

// Org CRUD
router.post('/', validate(createOrgSchema), createOrgHandler as any);
router.get('/:id', authorize(allRoles) as any, getOrgHandler as any);
router.patch('/:id', authorize(adminRoles) as any, validate(updateOrgSchema), updateOrgHandler as any);

// Member management
router.post(
  '/:id/invite',
  authorize(adminRoles) as any,
  validate(inviteMemberSchema),
  inviteMemberHandler as any
);
router.get('/:id/members', authorize(allRoles) as any, getMembersHandler as any);
router.patch(
  '/:id/members/:userId',
  authorize(adminRoles) as any,
  validate(updateMemberRoleSchema),
  updateMemberRoleHandler as any
);
router.delete(
  '/:id/members/:userId',
  authorize(adminRoles) as any,
  removeMemberHandler as any
);

export default router;
