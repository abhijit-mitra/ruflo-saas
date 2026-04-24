import { Request, Response, NextFunction } from 'express';
import { fileManagementService } from '../services/file-management.service';
import '../types';
import { AppError } from '../middleware/errorHandler';

export async function listContentsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const folderId = req.query.folderId as string | undefined;
    const result = await fileManagementService.listContents(projectId, folderId);
    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

export async function createFolderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    const projectId = req.params.projectId as string;
    const folder = await fileManagementService.createFolder(projectId, userId, req.body);
    res.status(201).json({ data: folder });
  } catch (error) {
    next(error);
  }
}

export async function renameFolderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const folderId = req.params.folderId as string;
    const folder = await fileManagementService.renameFolder(projectId, folderId, req.body);
    res.status(200).json({ data: folder });
  } catch (error) {
    next(error);
  }
}

export async function deleteFolderHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const folderId = req.params.folderId as string;
    await fileManagementService.deleteFolder(projectId, folderId);
    res.status(200).json({ data: { message: 'Folder deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function uploadFileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    if (!req.file) throw new AppError(400, 'BAD_REQUEST', 'No file uploaded');
    const projectId = req.params.projectId as string;
    const folderId = req.body.folderId as string | undefined;
    const file = await fileManagementService.uploadFile(projectId, userId, req.file, folderId);
    res.status(201).json({ data: file });
  } catch (error) {
    next(error);
  }
}

export async function deleteFileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const fileId = req.params.fileId as string;
    await fileManagementService.deleteFile(projectId, fileId);
    res.status(200).json({ data: { message: 'File deleted successfully' } });
  } catch (error) {
    next(error);
  }
}

export async function moveFileHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectId = req.params.projectId as string;
    const fileId = req.params.fileId as string;
    const file = await fileManagementService.moveFile(projectId, fileId, req.body.folderId);
    res.status(200).json({ data: file });
  } catch (error) {
    next(error);
  }
}
