import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaProject } = vi.hoisted(() => ({
  mockPrismaProject: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    project: mockPrismaProject,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
  },
}));

import { ProjectService } from '../../../src/services/project.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('ProjectService', () => {
  let service: ProjectService;

  const mockProject = {
    id: 'proj-1',
    name: 'Office Renovation',
    description: 'Full office renovation project',
    status: 'draft',
    orgId: 'org-1',
    createdById: 'user-1',
    address: '123 Main St',
    estimatedValue: 150000,
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-08-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProjectService();
  });

  describe('create', () => {
    it('creates a project linked to the org', async () => {
      mockPrismaProject.create.mockResolvedValue(mockProject);

      const result = await service.create('user-1', {
        name: 'Office Renovation',
        description: 'Full office renovation project',
        orgId: 'org-1',
        address: '123 Main St',
        estimatedValue: 150000,
      });

      expect(result).toEqual(mockProject);
      expect(mockPrismaProject.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Office Renovation',
          orgId: 'org-1',
          createdById: 'user-1',
          status: 'draft',
        }),
      });
    });
  });

  describe('list', () => {
    it('returns paginated projects for an org', async () => {
      mockPrismaProject.findMany.mockResolvedValue([mockProject]);
      mockPrismaProject.count.mockResolvedValue(1);

      const result = await service.list('org-1', 1, 10);

      expect(result.projects).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('filters projects by status', async () => {
      mockPrismaProject.findMany.mockResolvedValue([mockProject]);
      mockPrismaProject.count.mockResolvedValue(1);

      await service.list('org-1', 1, 10, 'active');

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        }),
      );
    });

    it('excludes soft-deleted projects', async () => {
      mockPrismaProject.findMany.mockResolvedValue([]);
      mockPrismaProject.count.mockResolvedValue(0);

      await service.list('org-1', 1, 10);

      expect(mockPrismaProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  describe('getById', () => {
    it('returns project', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(mockProject);
      const result = await service.getById('proj-1');
      expect(result.id).toBe('proj-1');
    });

    it('throws 404 for non-existent project', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(null);
      await expect(service.getById('non-existent')).rejects.toThrow(AppError);
      await expect(service.getById('non-existent')).rejects.toThrow('Project not found');
    });
  });

  describe('update', () => {
    it('updates project fields', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue({ ...mockProject, name: 'Updated Name' });

      const result = await service.update('proj-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });

    it('throws 404 when updating non-existent project', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(null);
      await expect(service.update('non-existent', { name: 'New' })).rejects.toThrow('Project not found');
    });
  });

  describe('softDelete', () => {
    it('soft deletes a project', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(mockProject);
      mockPrismaProject.update.mockResolvedValue({ ...mockProject, deletedAt: new Date() });

      await service.softDelete('proj-1');

      expect(mockPrismaProject.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
    });

    it('throws 404 when deleting non-existent project', async () => {
      mockPrismaProject.findFirst.mockResolvedValue(null);
      await expect(service.softDelete('non-existent')).rejects.toThrow('Project not found');
    });
  });
});
