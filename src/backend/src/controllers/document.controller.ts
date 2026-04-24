import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createDocumentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const doc = await documentService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: doc });
  } catch (error) {
    next(error);
  }
}

export async function listDocumentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await documentService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.documents,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocumentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await documentService.delete(req.params.id as string);
    res.status(200).json({ data: { message: 'Document deleted successfully' } });
  } catch (error) {
    next(error);
  }
}
