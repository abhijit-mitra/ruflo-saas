import { Request, Response, NextFunction } from 'express';
import { orgService } from '../services/org.service';
import '../types';
import { AppError } from '../middleware/errorHandler';
import { OrgRole } from '@prisma/client';

export async function createOrgHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const org = await orgService.create(userId, req.body);
    res.status(201).json({ data: org });
  } catch (error) {
    next(error);
  }
}

export async function getOrgHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const org = await orgService.getById(req.params.id as string);
    res.status(200).json({ data: org });
  } catch (error) {
    next(error);
  }
}

export async function updateOrgHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const org = await orgService.update(req.params.id as string, req.body);
    res.status(200).json({ data: org });
  } catch (error) {
    next(error);
  }
}

export async function inviteMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const invitation = await orgService.inviteMember(req.params.id as string, req.body, userId);
    res.status(201).json({ data: invitation });
  } catch (error) {
    next(error);
  }
}

export async function getMembersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await orgService.getMembers(req.params.id as string, page, limit);
    res.status(200).json({
      data: result.members,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRoleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.params.id as string;
    const userId = req.params.userId as string;
    const { role } = req.body;

    const updated = await orgService.updateMemberRole(orgId, userId, role as OrgRole);
    res.status(200).json({ data: updated });
  } catch (error) {
    next(error);
  }
}

export async function removeMemberHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.params.id as string;
    const userId = req.params.userId as string;

    await orgService.removeMember(orgId, userId);
    res.status(200).json({ data: { message: 'Member removed successfully' } });
  } catch (error) {
    next(error);
  }
}
