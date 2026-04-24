import { Request, Response, NextFunction } from 'express';
import { changeOrderService } from '../services/change-order.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createChangeOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const co = await changeOrderService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: co });
  } catch (error) {
    next(error);
  }
}

export async function listChangeOrdersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await changeOrderService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.changeOrders,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getChangeOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const co = await changeOrderService.getById(req.params.id as string);
    res.status(200).json({ data: co });
  } catch (error) {
    next(error);
  }
}

export async function updateChangeOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const co = await changeOrderService.update(req.params.id as string, req.body);
    res.status(200).json({ data: co });
  } catch (error) {
    next(error);
  }
}

export async function approveChangeOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const co = await changeOrderService.approve(req.params.id as string, userId);
    res.status(200).json({ data: co });
  } catch (error) {
    next(error);
  }
}

export async function rejectChangeOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const co = await changeOrderService.reject(req.params.id as string, userId);
    res.status(200).json({ data: co });
  } catch (error) {
    next(error);
  }
}
