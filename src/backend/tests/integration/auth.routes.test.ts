import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Disable rate limiting in tests
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

// Mock Prisma before any imports that use it
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: { findUnique: vi.fn(), create: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn() },
    orgMembership: { findUnique: vi.fn() },
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

// Mock passport strategies to avoid initialization errors
vi.mock('../../src/strategies/local.strategy', () => ({}));
vi.mock('../../src/strategies/google.strategy', () => ({}));

// Mock the auth service
vi.mock('../../src/services/auth.service', () => {
  const mockService = {
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  };
  return {
    authService: mockService,
    AuthService: vi.fn().mockImplementation(() => mockService),
  };
});

vi.mock('../../src/services/email.service', () => ({
  emailService: {
    sendPasswordReset: vi.fn(),
    sendInvitation: vi.fn(),
  },
}));

import app from '../../src/app';
import { authService } from '../../src/services/auth.service';
import { AppError } from '../../src/middleware/errorHandler';

const mockedAuthService = vi.mocked(authService);

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('returns 201 with valid body', async () => {
      mockedAuthService.signup.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'StrongPass1', name: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns 400 with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'bad-email', password: 'StrongPass1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 409 with duplicate email', async () => {
      mockedAuthService.signup.mockRejectedValue(
        new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists')
      );

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'dup@example.com', password: 'StrongPass1', name: 'Test' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with correct credentials', async () => {
      mockedAuthService.login.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'StrongPass1' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe('mock-access-token');
    });

    it('returns 401 with wrong password', async () => {
      mockedAuthService.login.mockRejectedValue(
        new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass1' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 200 with valid refresh cookie', async () => {
      mockedAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=valid-refresh-token');

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe('new-access-token');
    });

    it('returns 401 with no cookie', async () => {
      const res = await request(app).post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('NO_REFRESH_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 and clears cookie', async () => {
      mockedAuthService.logout.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', 'refreshToken=some-token');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 always (prevents enumeration)', async () => {
      mockedAuthService.forgotPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'anyone@example.com' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('returns 200 with valid token', async () => {
      mockedAuthService.resetPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-reset-token', password: 'NewStrongPass1' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Password reset successfully');
    });
  });
});
