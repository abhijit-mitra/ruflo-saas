import { Request, Response, NextFunction } from 'express';
import { bomService } from '../services/bom.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function createBOMHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const projectId = req.params.projectId as string;
    const bom = await bomService.create(projectId, userId, req.body);
    res.status(201).json({ data: bom });
  } catch (error) {
    next(error);
  }
}

export async function listBOMsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const boms = await bomService.list(projectId);
    res.status(200).json({ data: boms });
  } catch (error) {
    next(error);
  }
}

export async function getBOMHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const bomId = req.params.bomId as string;
    const bom = await bomService.getById(projectId, bomId);
    res.status(200).json({ data: bom });
  } catch (error) {
    next(error);
  }
}

export async function updateBOMHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const bomId = req.params.bomId as string;
    const bom = await bomService.update(projectId, bomId, req.body);
    res.status(200).json({ data: bom });
  } catch (error) {
    next(error);
  }
}

export async function deleteBOMHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const bomId = req.params.bomId as string;
    await bomService.delete(projectId, bomId);
    res.status(200).json({ data: { message: 'BOM deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function addProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bomId = req.params.bomId as string;
    const product = await bomService.addProduct(bomId, req.body);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function updateProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bomId = req.params.bomId as string;
    const productId = req.params.productId as string;
    const product = await bomService.updateProduct(bomId, productId, req.body);
    res.status(200).json({ data: product });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bomId = req.params.bomId as string;
    const productId = req.params.productId as string;
    await bomService.deleteProduct(bomId, productId);
    res.status(200).json({ data: { message: 'Product deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function importBOMHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (!req.file) throw new AppError(400, 'BAD_REQUEST', 'No file uploaded');
    const projectId = req.params.projectId as string;
    const bomId = req.params.bomId as string;
    const result = await bomService.importFile(projectId, userId, bomId, req.file);
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
}
