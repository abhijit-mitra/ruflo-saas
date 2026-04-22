import { PrismaClient, OrgRole, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { CreateOrgInput, UpdateOrgInput, InviteMemberInput } from '../utils/validation';
import { emailService } from './email.service';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  let slug = slugify(name);
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
    const existing = await prisma.organization.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    suffix++;
  }
}

export class OrgService {
  async create(userId: string, data: CreateOrgInput) {
    const slug = await generateUniqueSlug(data.name);

    const org = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          slug,
          domain: data.domain,
          logoUrl: data.logoUrl,
          settings: (data.settings ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.orgMembership.create({
        data: {
          userId,
          orgId: organization.id,
          role: 'owner',
        },
      });

      return organization;
    });

    return org;
  }

  async getById(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!org) {
      throw new AppError(404, 'ORG_NOT_FOUND', 'Organization not found');
    }

    return org;
  }

  async update(orgId: string, data: UpdateOrgInput) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new AppError(404, 'ORG_NOT_FOUND', 'Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        domain: data.domain,
        logoUrl: data.logoUrl,
        settings: data.settings as Prisma.InputJsonValue,
      },
    });

    return updated;
  }

  async inviteMember(orgId: string, data: InviteMemberInput, inviterId: string) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new AppError(404, 'ORG_NOT_FOUND', 'Organization not found');
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      const existingMembership = await prisma.orgMembership.findUnique({
        where: { userId_orgId: { userId: existingUser.id, orgId } },
      });
      if (existingMembership) {
        throw new AppError(409, 'ALREADY_MEMBER', 'This user is already a member of the organization');
      }
    }

    // Check for pending invitation
    const pendingInvite = await prisma.invitation.findFirst({
      where: { orgId, email: data.email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });
    if (pendingInvite) {
      throw new AppError(409, 'INVITE_PENDING', 'An invitation has already been sent to this email');
    }

    const token = uuidv4();

    const invitation = await prisma.invitation.create({
      data: {
        orgId,
        email: data.email,
        role: data.role as OrgRole,
        token,
        invitedById: inviterId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    await emailService.sendInvitation(data.email, org.name, token);

    return invitation;
  }

  async getMembers(orgId: string, page: number = 1, limit: number = 20) {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new AppError(404, 'ORG_NOT_FOUND', 'Organization not found');
    }

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.orgMembership.findMany({
        where: { orgId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { joinedAt: 'asc' },
      }),
      prisma.orgMembership.count({ where: { orgId } }),
    ]);

    return { members, total, page, limit };
  }

  async updateMemberRole(orgId: string, userId: string, role: OrgRole) {
    const membership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });

    if (!membership) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found in this organization');
    }

    if (membership.role === 'owner') {
      // Ensure at least one owner remains
      const ownerCount = await prisma.orgMembership.count({
        where: { orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new AppError(
          400,
          'LAST_OWNER',
          'Cannot change the role of the last owner. Transfer ownership first.'
        );
      }
    }

    const updated = await prisma.orgMembership.update({
      where: { userId_orgId: { userId, orgId } },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return updated;
  }

  async removeMember(orgId: string, userId: string) {
    const membership = await prisma.orgMembership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });

    if (!membership) {
      throw new AppError(404, 'MEMBER_NOT_FOUND', 'Member not found in this organization');
    }

    if (membership.role === 'owner') {
      const ownerCount = await prisma.orgMembership.count({
        where: { orgId, role: 'owner' },
      });
      if (ownerCount <= 1) {
        throw new AppError(
          400,
          'LAST_OWNER',
          'Cannot remove the last owner of the organization'
        );
      }
    }

    await prisma.orgMembership.delete({
      where: { userId_orgId: { userId, orgId } },
    });
  }
}

export const orgService = new OrgService();
