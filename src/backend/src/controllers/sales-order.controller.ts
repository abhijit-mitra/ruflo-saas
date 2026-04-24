import { Request, Response, NextFunction } from 'express';
import { salesOrderService } from '../services/sales-order.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createSalesOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const so = await salesOrderService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: so });
  } catch (error) {
    next(error);
  }
}

export async function listSalesOrdersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await salesOrderService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.salesOrders,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getSalesOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const so = await salesOrderService.getById(req.params.id as string);
    res.status(200).json({ data: so });
  } catch (error) {
    next(error);
  }
}

export async function updateSalesOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const so = await salesOrderService.update(req.params.id as string, req.body);
    res.status(200).json({ data: so });
  } catch (error) {
    next(error);
  }
}

export async function confirmSalesOrderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const so = await salesOrderService.confirm(req.params.id as string);
    res.status(200).json({ data: so });
  } catch (error) {
    next(error);
  }
}
