import { Request, Response, NextFunction } from 'express';
import { purchaseOrderService } from '../services/purchase-order.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createPurchaseOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const po = await purchaseOrderService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: po });
  } catch (error) {
    next(error);
  }
}

export async function listPurchaseOrdersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await purchaseOrderService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.purchaseOrders,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const po = await purchaseOrderService.getById(req.params.id as string);
    res.status(200).json({ data: po });
  } catch (error) {
    next(error);
  }
}

export async function updatePurchaseOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const po = await purchaseOrderService.update(req.params.id as string, req.body);
    res.status(200).json({ data: po });
  } catch (error) {
    next(error);
  }
}

export async function sendPurchaseOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const po = await purchaseOrderService.send(req.params.id as string);
    res.status(200).json({ data: po });
  } catch (error) {
    next(error);
  }
}
