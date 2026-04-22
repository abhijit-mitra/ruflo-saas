import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockPrismaOrganization,
  mockPrismaOrgMembership,
  mockPrismaUser,
  mockPrismaInvitation,
  mockPrismaTransaction,
} = vi.hoisted(() => ({
  mockPrismaOrganization: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mockPrismaOrgMembership: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaUser: {
    findUnique: vi.fn(),
  },
  mockPrismaInvitation: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    organization: mockPrismaOrganization,
    orgMembership: mockPrismaOrgMembership,
    user: mockPrismaUser,
    invitation: mockPrismaInvitation,
    $transaction: mockPrismaTransaction,
  })),
  OrgRole: {
    owner: 'owner',
    admin: 'admin',
    member: 'member',
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-invite-token'),
}));

vi.mock('../../../src/services/email.service', () => ({
  emailService: {
    sendPasswordReset: vi.fn(),
    sendInvitation: vi.fn(),
  },
}));

import { OrgService } from '../../../src/services/org.service';
import { AppError } from '../../../src/middleware/errorHandler';
import { emailService } from '../../../src/services/email.service';

describe('OrgService', () => {
  let service: OrgService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrgService();
  });

  describe('create', () => {
    it('creates org with unique slug and owner membership', async () => {
      // generateUniqueSlug calls findUnique to check slug availability
      mockPrismaOrganization.findUnique.mockResolvedValue(null);

      const mockOrg = {
        id: 'org-1',
        name: 'My Org',
        slug: 'my-org',
      };

      mockPrismaTransaction.mockImplementation(async (fn: Function) => {
        const tx = {
          organization: {
            create: vi.fn().mockResolvedValue(mockOrg),
          },
          orgMembership: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      });

      const result = await service.create('user-1', { name: 'My Org' });

      expect(result).toEqual(mockOrg);
      expect(mockPrismaTransaction).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns org with memberships', async () => {
      const mockOrg = {
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        memberships: [
          {
            id: 'mem-1',
            role: 'owner',
            joinedAt: new Date(),
            user: { id: 'user-1', email: 'owner@test.com', name: 'Owner', avatarUrl: null },
          },
        ],
        _count: { memberships: 1 },
      };
      mockPrismaOrganization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.getById('org-1');

      expect(result).toEqual(mockOrg);
      expect(mockPrismaOrganization.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'org-1' } })
      );
    });

    it('throws 404 for non-existent org', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(AppError);
      await expect(service.getById('nonexistent')).rejects.toThrow(
        'Organization not found'
      );
    });
  });

  describe('update', () => {
    it('updates org fields', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue({ id: 'org-1' });
      mockPrismaOrganization.update.mockResolvedValue({
        id: 'org-1',
        name: 'Updated Org',
      });

      const result = await service.update('org-1', { name: 'Updated Org' });

      expect(result.name).toBe('Updated Org');
      expect(mockPrismaOrganization.update).toHaveBeenCalled();
    });

    it('throws 404 if org not found', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'X' })
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('inviteMember', () => {
    it('creates invitation and sends email', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
      });
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockPrismaInvitation.findFirst.mockResolvedValue(null);
      mockPrismaInvitation.create.mockResolvedValue({
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
      });

      const result = await service.inviteMember(
        'org-1',
        { email: 'new@example.com', role: 'member' },
        'inviter-1'
      );

      expect(result.email).toBe('new@example.com');
      expect(emailService.sendInvitation).toHaveBeenCalledWith(
        'new@example.com',
        'Test Org',
        'mock-invite-token'
      );
    });

    it('throws if user already a member', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
      });
      mockPrismaUser.findUnique.mockResolvedValue({ id: 'user-2' });
      mockPrismaOrgMembership.findUnique.mockResolvedValue({
        userId: 'user-2',
        orgId: 'org-1',
        role: 'member',
      });

      await expect(
        service.inviteMember(
          'org-1',
          { email: 'existing@example.com', role: 'member' },
          'inviter-1'
        )
      ).rejects.toThrow('already a member');
    });
  });

  describe('getMembers', () => {
    it('returns paginated members', async () => {
      mockPrismaOrganization.findUnique.mockResolvedValue({ id: 'org-1' });
      mockPrismaOrgMembership.findMany.mockResolvedValue([
        {
          id: 'mem-1',
          role: 'owner',
          user: { id: 'u-1', email: 'a@b.com', name: 'A', avatarUrl: null },
        },
      ]);
      mockPrismaOrgMembership.count.mockResolvedValue(1);

      const result = await service.getMembers('org-1', 1, 20);

      expect(result.members).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('updateMemberRole', () => {
    it('updates role', async () => {
      mockPrismaOrgMembership.findUnique.mockResolvedValue({
        userId: 'user-2',
        orgId: 'org-1',
        role: 'member',
      });
      mockPrismaOrgMembership.update.mockResolvedValue({
        userId: 'user-2',
        orgId: 'org-1',
        role: 'admin',
        user: { id: 'user-2', email: 'u@b.com', name: 'U' },
      });

      const result = await service.updateMemberRole('org-1', 'user-2', 'admin' as any);

      expect(result.role).toBe('admin');
    });

    it('prevents demoting last owner', async () => {
      mockPrismaOrgMembership.findUnique.mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'owner',
      });
      mockPrismaOrgMembership.count.mockResolvedValue(1);

      await expect(
        service.updateMemberRole('org-1', 'user-1', 'member' as any)
      ).rejects.toThrow('Cannot change the role of the last owner');
    });
  });

  describe('removeMember', () => {
    it('removes membership', async () => {
      mockPrismaOrgMembership.findUnique.mockResolvedValue({
        userId: 'user-2',
        orgId: 'org-1',
        role: 'member',
      });
      mockPrismaOrgMembership.delete.mockResolvedValue({});

      await service.removeMember('org-1', 'user-2');

      expect(mockPrismaOrgMembership.delete).toHaveBeenCalledWith({
        where: { userId_orgId: { userId: 'user-2', orgId: 'org-1' } },
      });
    });

    it('prevents removing last owner', async () => {
      mockPrismaOrgMembership.findUnique.mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'owner',
      });
      mockPrismaOrgMembership.count.mockResolvedValue(1);

      await expect(
        service.removeMember('org-1', 'user-1')
      ).rejects.toThrow('Cannot remove the last owner');
    });

    it('throws 404 for non-existent member', async () => {
      mockPrismaOrgMembership.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember('org-1', 'nonexistent')
      ).rejects.toThrow('Member not found');
    });
  });
});
