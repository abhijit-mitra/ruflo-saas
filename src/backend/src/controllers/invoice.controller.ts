import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const invoice = await invoiceService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function listInvoicesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await invoiceService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.invoices,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.getById(req.params.id as string);
    res.status(200).json({ data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.update(req.params.id as string, req.body);
    res.status(200).json({ data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function sendInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.send(req.params.id as string);
    res.status(200).json({ data: invoice });
  } catch (error) {
    next(error);
  }
}

export async function payInvoiceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await invoiceService.recordPayment(req.params.id as string, req.body.amount);
    res.status(200).json({ data: invoice });
  } catch (error) {
    next(error);
  }
}
