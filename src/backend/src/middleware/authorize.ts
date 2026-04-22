import { Request, Response, NextFunction } from 'express';
import { PrismaClient, OrgRole } from '@prisma/client';
import '../types';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

export function authorize(allowedRoles: OrgRole[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const orgId = (req.params.orgId || req.params.id) as string;

      if (!userId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }

      if (!orgId) {
        throw new AppError(400, 'BAD_REQUEST', 'Organization ID is required');
      }

      const membership = await prisma.orgMembership.findUnique({
        where: {
          userId_orgId: { userId, orgId },
        },
      });

      if (!membership) {
        throw new AppError(403, 'FORBIDDEN', 'You are not a member of this organization');
      }

      if (!allowedRoles.includes(membership.role)) {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions for this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
