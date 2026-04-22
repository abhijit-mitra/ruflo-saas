import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { UpdateUserInput } from '../utils/validation';

const prisma = new PrismaClient();

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            role: true,
            joinedAt: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Check if user is the sole owner of any org
    const ownedOrgs = await prisma.orgMembership.findMany({
      where: { userId, role: 'owner' },
      include: {
        organization: {
          include: {
            memberships: { where: { role: 'owner' } },
          },
        },
      },
    });

    for (const membership of ownedOrgs) {
      if (membership.organization.memberships.length === 1) {
        throw new AppError(
          400,
          'SOLE_OWNER',
          `You are the sole owner of "${membership.organization.name}". Transfer ownership before deleting your account.`
        );
      }
    }

    await prisma.user.delete({ where: { id: userId } });
  }
}

export const userService = new UserService();
