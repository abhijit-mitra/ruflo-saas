import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaFolder, mockPrismaFile } = vi.hoisted(() => ({
  mockPrismaFolder: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockPrismaFile: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    projectFolder: mockPrismaFolder,
    projectFile: mockPrismaFile,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
  },
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { FileManagementService } from '../../../src/services/file-management.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('FileManagementService', () => {
  let service: FileManagementService;

  const mockFolder = {
    id: 'folder-1',
    projectId: 'proj-1',
    parentId: null,
    name: 'Drawings',
    createdById: 'user-1',
    createdBy: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile = {
    id: 'file-1',
    projectId: 'proj-1',
    folderId: 'folder-1',
    fileName: 'blueprint.pdf',
    fileUrl: '/uploads/abc123.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    uploadedById: 'user-1',
    uploadedBy: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMulterFile = {
    originalname: 'blueprint.pdf',
    mimetype: 'application/pdf',
    size: 1024000,
    path: '/tmp/uploads/abc123.pdf',
    filename: 'abc123.pdf',
  } as unknown as Express.Multer.File;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FileManagementService();
  });

  describe('createFolder', () => {
    it('creates a root-level folder', async () => {
      mockPrismaFolder.create.mockResolvedValue(mockFolder);

      const result = await service.createFolder('proj-1', 'user-1', {
        name: 'Drawings',
      });

      expect(result.name).toBe('Drawings');
      expect(mockPrismaFolder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            name: 'Drawings',
            createdById: 'user-1',
            parentId: null,
          }),
        })
      );
    });

    it('creates a folder under a parent', async () => {
      const childFolder = { ...mockFolder, id: 'folder-2', parentId: 'folder-1', name: 'Sub' };
      mockPrismaFolder.findFirst.mockResolvedValue(mockFolder);
      mockPrismaFolder.create.mockResolvedValue(childFolder);

      const result = await service.createFolder('proj-1', 'user-1', {
        name: 'Sub',
        parentId: 'folder-1',
      });

      expect(result.parentId).toBe('folder-1');
    });

    it('throws 404 when parent folder does not exist', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(null);

      await expect(
        service.createFolder('proj-1', 'user-1', {
          name: 'Sub',
          parentId: 'non-existent',
        })
      ).rejects.toThrow('Parent folder not found');
    });
  });

  describe('listContents', () => {
    it('lists root-level folders and files', async () => {
      mockPrismaFolder.findMany.mockResolvedValue([mockFolder]);
      mockPrismaFile.findMany.mockResolvedValue([mockFile]);

      const result = await service.listContents('proj-1');

      expect(result.folders).toHaveLength(1);
      expect(result.files).toHaveLength(1);
    });

    it('lists contents of a specific folder', async () => {
      mockPrismaFolder.findMany.mockResolvedValue([]);
      mockPrismaFile.findMany.mockResolvedValue([mockFile]);

      const result = await service.listContents('proj-1', 'folder-1');

      expect(mockPrismaFolder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', parentId: 'folder-1' },
        })
      );
      expect(mockPrismaFile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1', folderId: 'folder-1' },
        })
      );
    });

    it('returns empty arrays when nothing exists', async () => {
      mockPrismaFolder.findMany.mockResolvedValue([]);
      mockPrismaFile.findMany.mockResolvedValue([]);

      const result = await service.listContents('proj-1');

      expect(result.folders).toHaveLength(0);
      expect(result.files).toHaveLength(0);
    });
  });

  describe('uploadFile', () => {
    it('uploads a file to root level', async () => {
      mockPrismaFile.create.mockResolvedValue(mockFile);

      const result = await service.uploadFile('proj-1', 'user-1', mockMulterFile);

      expect(result.fileName).toBe('blueprint.pdf');
      expect(mockPrismaFile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            fileName: 'blueprint.pdf',
            uploadedById: 'user-1',
            folderId: null,
          }),
        })
      );
    });

    it('uploads a file to a specific folder', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(mockFolder);
      mockPrismaFile.create.mockResolvedValue({ ...mockFile, folderId: 'folder-1' });

      const result = await service.uploadFile('proj-1', 'user-1', mockMulterFile, 'folder-1');

      expect(result.folderId).toBe('folder-1');
    });

    it('throws 404 when target folder does not exist', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadFile('proj-1', 'user-1', mockMulterFile, 'non-existent')
      ).rejects.toThrow('Target folder not found');
    });
  });

  describe('renameFolder', () => {
    it('renames an existing folder', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(mockFolder);
      mockPrismaFolder.update.mockResolvedValue({ ...mockFolder, name: 'Renamed' });

      const result = await service.renameFolder('proj-1', 'folder-1', { name: 'Renamed' });

      expect(result.name).toBe('Renamed');
    });

    it('throws 404 for non-existent folder', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(null);

      await expect(
        service.renameFolder('proj-1', 'non-existent', { name: 'X' })
      ).rejects.toThrow('Folder not found');
    });
  });

  describe('deleteFile', () => {
    it('deletes an existing file', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(mockFile);
      mockPrismaFile.delete.mockResolvedValue(mockFile);

      await service.deleteFile('proj-1', 'file-1');

      expect(mockPrismaFile.delete).toHaveBeenCalledWith({ where: { id: 'file-1' } });
    });

    it('throws 404 for non-existent file', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(null);

      await expect(service.deleteFile('proj-1', 'non-existent'))
        .rejects.toThrow('File not found');
    });
  });

  describe('moveFile', () => {
    it('moves a file to a different folder', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(mockFile);
      mockPrismaFolder.findFirst.mockResolvedValue(mockFolder);
      mockPrismaFile.update.mockResolvedValue({ ...mockFile, folderId: 'folder-2' });

      const result = await service.moveFile('proj-1', 'file-1', 'folder-2');

      expect(mockPrismaFile.update).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        data: { folderId: 'folder-2' },
      });
    });

    it('moves a file to root (null folder)', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(mockFile);
      mockPrismaFile.update.mockResolvedValue({ ...mockFile, folderId: null });

      await service.moveFile('proj-1', 'file-1', null);

      expect(mockPrismaFile.update).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        data: { folderId: null },
      });
    });

    it('throws 404 for non-existent file', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(null);

      await expect(service.moveFile('proj-1', 'non-existent', 'folder-1'))
        .rejects.toThrow('File not found');
    });

    it('throws 404 for non-existent target folder', async () => {
      mockPrismaFile.findFirst.mockResolvedValue(mockFile);
      mockPrismaFolder.findFirst.mockResolvedValue(null);

      await expect(service.moveFile('proj-1', 'file-1', 'non-existent'))
        .rejects.toThrow('Target folder not found');
    });
  });

  describe('deleteFolder', () => {
    it('deletes a folder and cleans up files', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(mockFolder);
      mockPrismaFile.findMany.mockResolvedValue([{ fileUrl: '/uploads/abc.pdf' }]);
      mockPrismaFolder.findMany.mockResolvedValue([]);
      mockPrismaFolder.delete.mockResolvedValue(mockFolder);

      await service.deleteFolder('proj-1', 'folder-1');

      expect(mockPrismaFolder.delete).toHaveBeenCalledWith({ where: { id: 'folder-1' } });
    });

    it('throws 404 for non-existent folder', async () => {
      mockPrismaFolder.findFirst.mockResolvedValue(null);

      await expect(service.deleteFolder('proj-1', 'non-existent'))
        .rejects.toThrow('Folder not found');
    });
  });
});
