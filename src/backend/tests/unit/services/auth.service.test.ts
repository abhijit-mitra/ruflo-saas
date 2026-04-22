import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mock objects are available when vi.mock is hoisted
const {
  mockPrismaUser,
  mockPrismaRefreshToken,
  mockPrismaPasswordResetToken,
  mockPrismaTransaction,
} = vi.hoisted(() => ({
  mockPrismaUser: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mockPrismaRefreshToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  mockPrismaPasswordResetToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: mockPrismaUser,
    refreshToken: mockPrismaRefreshToken,
    passwordResetToken: mockPrismaPasswordResetToken,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-at-least-32-chars',
  },
}));

vi.mock('../../../src/config/auth', () => ({
  BCRYPT_ROUNDS: 4,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  ACCESS_TOKEN_EXPIRY: '15m',
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-v4'),
}));

vi.mock('../../../src/utils/token', () => ({
  generateAccessToken: vi.fn(() => 'mock-access-token'),
  generateRefreshToken: vi.fn(() => 'mock-refresh-token'),
  hashToken: vi.fn(() => 'mock-hashed-token'),
}));

vi.mock('../../../src/services/email.service', () => ({
  emailService: {
    sendPasswordReset: vi.fn(),
    sendInvitation: vi.fn(),
  },
}));

import { AuthService } from '../../../src/services/auth.service';
import bcrypt from 'bcryptjs';
import { AppError } from '../../../src/middleware/errorHandler';
import { emailService } from '../../../src/services/email.service';

const mockedBcrypt = vi.mocked(bcrypt);

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService();
  });

  describe('signup', () => {
    it('creates user and returns tokens', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);
      mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockPrismaUser.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      mockPrismaRefreshToken.create.mockResolvedValue({});

      const result = await service.signup({
        email: 'test@example.com',
        password: 'StrongPass1',
        name: 'Test User',
      });

      expect(result.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockPrismaUser.create).toHaveBeenCalled();
    });

    it('throws on duplicate email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'StrongPass1',
          name: 'Test User',
        })
      ).rejects.toThrow(AppError);

      await expect(
        service.signup({
          email: 'test@example.com',
          password: 'StrongPass1',
          name: 'Test User',
        })
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
      });
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockPrismaRefreshToken.create.mockResolvedValue({});

      const result = await service.login('test@example.com', 'StrongPass1');

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('throws on wrong password', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      });
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login('test@example.com', 'WrongPass1')
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws on non-existent email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'AnyPass1')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('returns new token pair', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'mock-hashed-token',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockPrismaRefreshToken.update.mockResolvedValue({});
      mockPrismaRefreshToken.create.mockResolvedValue({});

      const result = await service.refreshToken('some-refresh-token');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockPrismaRefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        })
      );
    });

    it('throws on revoked token', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'mock-hashed-token',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(
        service.refreshToken('revoked-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('throws on expired token', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        tokenHash: 'mock-hashed-token',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(
        service.refreshToken('expired-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('throws when token not found', async () => {
      mockPrismaRefreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('nonexistent-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });

  describe('forgotPassword', () => {
    it('creates reset token for existing user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        provider: 'local',
      });
      mockPrismaPasswordResetToken.create.mockResolvedValue({});

      await service.forgotPassword('test@example.com');

      expect(mockPrismaPasswordResetToken.create).toHaveBeenCalled();
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        'test@example.com',
        'mock-uuid-v4'
      );
    });

    it('does not throw for non-existent email', async () => {
      mockPrismaUser.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com')
      ).resolves.toBeUndefined();

      expect(mockPrismaPasswordResetToken.create).not.toHaveBeenCalled();
    });

    it('does not create token for OAuth user', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        provider: 'google',
      });

      await service.forgotPassword('test@example.com');

      expect(mockPrismaPasswordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      mockPrismaPasswordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        tokenHash: 'mock-hashed-token',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
      });
      mockedBcrypt.hash.mockResolvedValue('new-hashed-password' as never);
      mockPrismaTransaction.mockResolvedValue([]);

      await service.resetPassword('valid-token', 'NewStrongPass1');

      expect(mockPrismaTransaction).toHaveBeenCalled();
    });

    it('throws on invalid reset token', async () => {
      mockPrismaPasswordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPass123')
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('throws on used reset token', async () => {
      mockPrismaPasswordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000),
      });

      await expect(
        service.resetPassword('used-token', 'NewPass123')
      ).rejects.toThrow('Invalid or expired reset token');
    });
  });
});
