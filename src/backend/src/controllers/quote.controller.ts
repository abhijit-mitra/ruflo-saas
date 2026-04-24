import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../services/quote.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const quote = await quoteService.create(req.params.projectId as string, userId, req.body);
    res.status(201).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function listQuotesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const result = await quoteService.listByProject(req.params.projectId as string, page, limit);
    res.status(200).json({
      data: result.quotes,
      meta: { page: result.page, limit: result.limit, total: result.total },
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await quoteService.getById(req.params.id as string);
    res.status(200).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function updateQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await quoteService.update(req.params.id as string, req.body);
    res.status(200).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function submitQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await quoteService.submit(req.params.id as string);
    res.status(200).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function winQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await quoteService.win(req.params.id as string);
    res.status(200).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function loseQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const quote = await quoteService.lose(req.params.id as string);
    res.status(200).json({ data: quote });
  } catch (error) {
    next(error);
  }
}

export async function reviseQuoteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const quote = await quoteService.revise(req.params.id as string, userId);
    res.status(201).json({ data: quote });
  } catch (error) {
    next(error);
  }
}
