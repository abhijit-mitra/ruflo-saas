import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaUser, mockPrismaOrgMembership } = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockPrismaOrgMembership: {
    findMany: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: mockPrismaUser,
    orgMembership: mockPrismaOrgMembership,
  })),
}));

import { UserService } from '../../../src/services/user.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new UserService();
  });

  describe('getProfile', () => {
    it('returns user without password hash', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        emailVerified: false,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberships: [],
      };
      mockPrismaUser.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          select: expect.objectContaining({
            id: true,
            email: true,
            name: true,
          }),
        })
      );
    });

    it('throws 404 for non-existent user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        AppError
      );
      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('updateProfile', () => {
    it('updates name and avatar', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaUser.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.png',
        emailVerified: false,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateProfile('user-1', {
        name: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.png',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('throws 404 if user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent', { name: 'X' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('deleteAccount', () => {
    it('deletes user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaOrgMembership.findMany.mockResolvedValue([]);
      mockPrismaUser.delete.mockResolvedValue({});

      await service.deleteAccount('user-1');

      expect(mockPrismaUser.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('throws if user is sole org owner', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaOrgMembership.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          role: 'owner',
          organization: {
            name: 'Test Org',
            memberships: [{ userId: 'user-1', role: 'owner' }],
          },
        },
      ]);

      await expect(service.deleteAccount('user-1')).rejects.toThrow(
        'sole owner'
      );
    });

    it('throws 404 if user not found', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });

    it('allows deletion when user owns org with other owners', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'user-1' });
      mockPrismaOrgMembership.findMany.mockResolvedValue([
        {
          userId: 'user-1',
          role: 'owner',
          organization: {
            name: 'Test Org',
            memberships: [
              { userId: 'user-1', role: 'owner' },
              { userId: 'user-2', role: 'owner' },
            ],
          },
        },
      ]);
      mockPrismaUser.delete.mockResolvedValue({});

      await service.deleteAccount('user-1');

      expect(mockPrismaUser.delete).toHaveBeenCalled();
    });
  });
});
