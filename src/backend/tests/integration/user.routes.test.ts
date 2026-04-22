import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Disable rate limiting in tests
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    orgMembership: { findUnique: vi.fn(), findMany: vi.fn() },
    organization: { findUnique: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn() },
    invitation: { findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  })),
  OrgRole: { owner: 'owner', admin: 'admin', member: 'member' },
}));

vi.mock('../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long',
    GOOGLE_CLIENT_ID: 'test-google-id',
    GOOGLE_CLIENT_SECRET: 'test-google-secret',
    MICROSOFT_CLIENT_ID: 'test-ms-id',
    MICROSOFT_CLIENT_SECRET: 'test-ms-secret',
    MICROSOFT_TENANT_ID: 'common',
    FRONTEND_URL: 'http://localhost:3000',
    PORT: 4000,
  },
}));

vi.mock('../../src/config/auth', () => ({
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  BCRYPT_ROUNDS: 4,
}));

vi.mock('../../src/strategies/local.strategy', () => ({}));
vi.mock('../../src/strategies/google.strategy', () => ({}));

// Mock authenticate to inject user
vi.mock('../../src/middleware/authenticate', async () => {
  const { AppError } = await vi.importActual<typeof import('../../src/middleware/errorHandler')>('../../src/middleware/errorHandler');
  return {
    authenticate: vi.fn((req: any, _res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer valid-token') {
        req.user = { userId: 'user-1' };
        next();
      } else {
        next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
      }
    }),
  };
});

vi.mock('../../src/services/user.service', () => {
  const mockService = {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
  };
  return {
    userService: mockService,
    UserService: vi.fn().mockImplementation(() => mockService),
  };
});

vi.mock('../../src/services/auth.service', () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
  AuthService: vi.fn(),
}));

vi.mock('../../src/services/email.service', () => ({
  emailService: {
    sendPasswordReset: vi.fn(),
    sendInvitation: vi.fn(),
  },
}));

vi.mock('../../src/services/org.service', () => ({
  orgService: {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    inviteMember: vi.fn(),
    getMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  },
  OrgService: vi.fn(),
}));

import app from '../../src/app';
import { userService } from '../../src/services/user.service';

const mockedUserService = vi.mocked(userService);

describe('User routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/users/me', () => {
    it('returns 200 with user profile', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        emailVerified: false,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
        memberships: [],
      } as any);

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('test@example.com');
    });

    it('returns 401 without auth header', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('returns 200 and updates profile', async () => {
      mockedUserService.updateProfile.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Updated Name',
        avatarUrl: null,
        emailVerified: false,
        provider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('returns 401 without auth header', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'X' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/me', () => {
    it('returns 200 and deletes account', async () => {
      mockedUserService.deleteAccount.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Account deleted successfully');
    });

    it('returns 401 without auth header', async () => {
      const res = await request(app).delete('/api/users/me');
      expect(res.status).toBe(401);
    });
  });
});
