import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createProjectHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const project = await projectService.create(userId, req.body);
    res.status(201).json({ data: project });
  } catch (error) {
    next(error);
  }
}

export async function listProjectsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const orgId = req.query.orgId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;

    const result = await projectService.list(orgId, page, limit, status, userId);
    res.status(200).json({
      data: result.projects,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getById(req.params.id as string);
    res.status(200).json({ data: project });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.update(req.params.id as string, req.body);
    res.status(200).json({ data: project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.softDelete(req.params.id as string);
    res.status(200).json({ data: { message: 'Project deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
