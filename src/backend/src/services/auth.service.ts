import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { BCRYPT_ROUNDS, REFRESH_TOKEN_EXPIRY_DAYS } from '../config/auth';
import { generateAccessToken, generateRefreshToken, hashToken } from '../utils/token';
import { AppError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import { OAuthProfile } from '../types';

const prisma = new PrismaClient();

export class AuthService {
  async signup(data: { email: string; password: string; name: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        provider: 'local',
      },
    });

    const tokens = await this.createTokenPair(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const tokens = await this.createTokenPair(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async googleAuth(profile: OAuthProfile) {
    return this.oauthAuth(profile, 'google');
  }

  async microsoftAuth(profile: OAuthProfile) {
    return this.oauthAuth(profile, 'microsoft');
  }

  private async oauthAuth(profile: OAuthProfile, provider: 'google' | 'microsoft') {
    let user = await prisma.user.findFirst({
      where: { provider, providerId: profile.id },
    });

    if (!user) {
      user = await prisma.user.findUnique({ where: { email: profile.email } });

      if (user) {
        // Link existing account to this provider
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider,
            providerId: profile.id,
            emailVerified: true,
            avatarUrl: profile.avatarUrl || user.avatarUrl,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            provider,
            providerId: profile.id,
            emailVerified: true,
          },
        });
      }
    }

    const tokens = await this.createTokenPair(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const tokenHash = hashToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.createTokenPair(storedToken.userId);

    return tokens;
  }

  async logout(token: string): Promise<void> {
    const tokenHash = hashToken(token);

    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.provider !== 'local') {
      return;
    }

    const token = uuidv4();
    const tokenHash = hashToken(token);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await emailService.sendPasswordReset(email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new AppError(400, 'INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for this user
      prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async createTokenPair(userId: string) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        ),
      },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
