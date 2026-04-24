import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateFolderInput, RenameFolderInput } from '../utils/validation';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export class FileManagementService {
  async listContents(projectId: string, folderId?: string) {
    const where = folderId
      ? { projectId, parentId: folderId }
      : { projectId, parentId: null };

    const fileWhere = folderId
      ? { projectId, folderId }
      : { projectId, folderId: null };

    const [folders, files] = await Promise.all([
      prisma.projectFolder.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { children: true, files: true } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.projectFile.findMany({
        where: fileWhere,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { fileName: 'asc' },
      }),
    ]);

    return { folders, files };
  }

  async createFolder(projectId: string, userId: string, data: CreateFolderInput) {
    if (data.parentId) {
      const parent = await prisma.projectFolder.findFirst({
        where: { id: data.parentId, projectId },
      });
      if (!parent) {
        throw new AppError(404, 'FOLDER_NOT_FOUND', 'Parent folder not found');
      }
    }

    const folder = await prisma.projectFolder.create({
      data: {
        projectId,
        parentId: data.parentId || null,
        name: data.name,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return folder;
  }

  async renameFolder(projectId: string, folderId: string, data: RenameFolderInput) {
    const folder = await prisma.projectFolder.findFirst({
      where: { id: folderId, projectId },
    });
    if (!folder) {
      throw new AppError(404, 'FOLDER_NOT_FOUND', 'Folder not found');
    }

    return prisma.projectFolder.update({
      where: { id: folderId },
      data: { name: data.name },
    });
  }

  async deleteFolder(projectId: string, folderId: string) {
    const folder = await prisma.projectFolder.findFirst({
      where: { id: folderId, projectId },
    });
    if (!folder) {
      throw new AppError(404, 'FOLDER_NOT_FOUND', 'Folder not found');
    }

    // Cascade delete is handled by Prisma relations for children,
    // but we need to clean up physical files
    const files = await this.collectFilesInFolder(folderId);
    for (const file of files) {
      this.deletePhysicalFile(file.fileUrl);
    }

    await prisma.projectFolder.delete({ where: { id: folderId } });
  }

  async uploadFile(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    folderId?: string
  ) {
    if (folderId) {
      const folder = await prisma.projectFolder.findFirst({
        where: { id: folderId, projectId },
      });
      if (!folder) {
        throw new AppError(404, 'FOLDER_NOT_FOUND', 'Target folder not found');
      }
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // file.path is set by multer's disk storage
    const relativePath = path.relative(UPLOADS_DIR, file.path);
    const fileUrl = `/uploads/${relativePath}`;

    const projectFile = await prisma.projectFile.create({
      data: {
        projectId,
        folderId: folderId || null,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return projectFile;
  }

  async deleteFile(projectId: string, fileId: string) {
    const file = await prisma.projectFile.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) {
      throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    }

    this.deletePhysicalFile(file.fileUrl);
    await prisma.projectFile.delete({ where: { id: fileId } });
  }

  async moveFile(projectId: string, fileId: string, folderId: string | null) {
    const file = await prisma.projectFile.findFirst({
      where: { id: fileId, projectId },
    });
    if (!file) {
      throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    }

    if (folderId) {
      const folder = await prisma.projectFolder.findFirst({
        where: { id: folderId, projectId },
      });
      if (!folder) {
        throw new AppError(404, 'FOLDER_NOT_FOUND', 'Target folder not found');
      }
    }

    return prisma.projectFile.update({
      where: { id: fileId },
      data: { folderId },
    });
  }

  /**
   * Create a ProjectFile record from an already-saved multer file.
   * Used by BOM import to register the uploaded file in project file management.
   */
  async createFileRecord(
    projectId: string,
    userId: string,
    file: Express.Multer.File,
    folderId?: string
  ) {
    const relativePath = path.relative(UPLOADS_DIR, file.path);
    const fileUrl = `/uploads/${relativePath}`;

    return prisma.projectFile.create({
      data: {
        projectId,
        folderId: folderId || null,
        fileName: file.originalname,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedById: userId,
      },
    });
  }

  /**
   * Get or create a "BOM Imports" folder for a project.
   */
  async getOrCreateBOMImportsFolder(projectId: string, userId: string) {
    const existing = await prisma.projectFolder.findFirst({
      where: { projectId, name: 'BOM Imports', parentId: null },
    });
    if (existing) return existing;

    return prisma.projectFolder.create({
      data: {
        projectId,
        name: 'BOM Imports',
        createdById: userId,
        parentId: null,
      },
    });
  }

  private async collectFilesInFolder(folderId: string): Promise<{ fileUrl: string }[]> {
    const files = await prisma.projectFile.findMany({
      where: { folderId },
      select: { fileUrl: true },
    });

    const childFolders = await prisma.projectFolder.findMany({
      where: { parentId: folderId },
      select: { id: true },
    });

    for (const child of childFolders) {
      const childFiles = await this.collectFilesInFolder(child.id);
      files.push(...childFiles);
    }

    return files;
  }

  private deletePhysicalFile(fileUrl: string) {
    try {
      const fullPath = path.resolve(UPLOADS_DIR, fileUrl.replace(/^\/uploads\//, ''));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch {
      // Best effort cleanup
    }
  }
}

export const fileManagementService = new FileManagementService();
