import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Disable rate limiting in tests
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    orgMembership: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    invitation: { findFirst: vi.fn(), create: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn() },
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

// Import AppError before mocks that use it
import { AppError } from '../../src/middleware/errorHandler';

// Mock authenticate to inject user
vi.mock('../../src/middleware/authenticate', async () => {
  const { AppError: AE } = await vi.importActual<typeof import('../../src/middleware/errorHandler')>('../../src/middleware/errorHandler');
  return {
    authenticate: vi.fn((req: any, _res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (authHeader === 'Bearer valid-token') {
        req.user = { userId: 'user-1' };
        next();
      } else {
        next(new AE(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
      }
    }),
  };
});

// Mock authorize to check roles
vi.mock('../../src/middleware/authorize', async () => {
  const { AppError: AE } = await vi.importActual<typeof import('../../src/middleware/errorHandler')>('../../src/middleware/errorHandler');
  return {
    authorize: vi.fn((allowedRoles: string[]) => {
      return (req: any, _res: any, next: any) => {
        const testRole = req.headers['x-test-role'] || 'owner';
        if (allowedRoles.includes(testRole)) {
          next();
        } else {
          next(new AE(403, 'FORBIDDEN', 'Insufficient permissions'));
        }
      };
    }),
  };
});

vi.mock('../../src/services/org.service', () => {
  const mockService = {
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    inviteMember: vi.fn(),
    getMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  };
  return {
    orgService: mockService,
    OrgService: vi.fn().mockImplementation(() => mockService),
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

vi.mock('../../src/services/project.service', () => ({
  projectService: { create: vi.fn(), list: vi.fn(), getById: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
  ProjectService: vi.fn(),
}));
vi.mock('../../src/services/quote.service', () => ({
  quoteService: { create: vi.fn(), listByProject: vi.fn(), getById: vi.fn(), update: vi.fn(), submit: vi.fn(), win: vi.fn(), lose: vi.fn(), revise: vi.fn() },
  QuoteService: vi.fn(),
}));
vi.mock('../../src/services/document.service', () => ({
  documentService: { create: vi.fn(), listByProject: vi.fn(), delete: vi.fn() },
  DocumentService: vi.fn(),
}));
vi.mock('../../src/services/change-order.service', () => ({
  changeOrderService: { create: vi.fn(), listByProject: vi.fn(), getById: vi.fn(), update: vi.fn(), approve: vi.fn(), reject: vi.fn() },
  ChangeOrderService: vi.fn(),
}));
vi.mock('../../src/services/invoice.service', () => ({
  invoiceService: { create: vi.fn(), listByProject: vi.fn(), getById: vi.fn(), update: vi.fn(), send: vi.fn(), recordPayment: vi.fn() },
  InvoiceService: vi.fn(),
}));
vi.mock('../../src/services/purchase-order.service', () => ({
  purchaseOrderService: { create: vi.fn(), listByProject: vi.fn(), getById: vi.fn(), update: vi.fn(), send: vi.fn() },
  PurchaseOrderService: vi.fn(),
}));
vi.mock('../../src/services/sales-order.service', () => ({
  salesOrderService: { create: vi.fn(), listByProject: vi.fn(), getById: vi.fn(), update: vi.fn(), confirm: vi.fn() },
  SalesOrderService: vi.fn(),
}));
vi.mock('../../src/utils/numbering', () => ({ generateNumber: vi.fn(() => 'NUM-2026-0001') }));

import app from '../../src/app';
import { orgService } from '../../src/services/org.service';

const mockedOrgService = vi.mocked(orgService);

describe('Org routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/orgs', () => {
    it('returns 201 and creates org with auth header', async () => {
      mockedOrgService.create.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
      } as any);

      const res = await request(app)
        .post('/api/orgs')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test Org' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Test Org');
    });

    it('returns 401 without auth header', async () => {
      const res = await request(app)
        .post('/api/orgs')
        .send({ name: 'Test Org' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orgs/:id', () => {
    it('returns 200 with org data', async () => {
      mockedOrgService.getById.mockResolvedValue({
        id: 'org-1',
        name: 'Test Org',
        slug: 'test-org',
        memberships: [],
        _count: { memberships: 0 },
      } as any);

      const res = await request(app)
        .get('/api/orgs/org-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Test Org');
    });

    it('returns 403 when user lacks required role', async () => {
      const res = await request(app)
        .get('/api/orgs/org-1')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'viewer');

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/orgs/:id', () => {
    it('returns 200 and updates org for admin', async () => {
      mockedOrgService.update.mockResolvedValue({
        id: 'org-1',
        name: 'Updated Org',
      } as any);

      const res = await request(app)
        .patch('/api/orgs/org-1')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'admin')
        .send({ name: 'Updated Org' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Org');
    });
  });

  describe('POST /api/orgs/:id/invite', () => {
    it('returns 201 and sends invite', async () => {
      mockedOrgService.inviteMember.mockResolvedValue({
        id: 'inv-1',
        email: 'new@example.com',
        role: 'member',
      } as any);

      const res = await request(app)
        .post('/api/orgs/org-1/invite')
        .set('Authorization', 'Bearer valid-token')
        .set('x-test-role', 'admin')
        .send({ email: 'new@example.com', role: 'member' });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('new@example.com');
    });
  });

  describe('GET /api/orgs/:id/members', () => {
    it('returns 200 with members', async () => {
      mockedOrgService.getMembers.mockResolvedValue({
        members: [{ id: 'mem-1', role: 'owner', user: { id: 'u-1', name: 'Owner' } }],
        total: 1,
        page: 1,
        limit: 20,
      } as any);

      const res = await request(app)
        .get('/api/orgs/org-1/members')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe('401 on all routes without auth header', () => {
    it('GET /api/orgs/:id returns 401', async () => {
      const res = await request(app).get('/api/orgs/org-1');
      expect(res.status).toBe(401);
    });

    it('PATCH /api/orgs/:id returns 401', async () => {
      const res = await request(app).patch('/api/orgs/org-1').send({ name: 'X' });
      expect(res.status).toBe(401);
    });

    it('POST /api/orgs/:id/invite returns 401', async () => {
      const res = await request(app)
        .post('/api/orgs/org-1/invite')
        .send({ email: 'x@y.com', role: 'member' });
      expect(res.status).toBe(401);
    });

    it('GET /api/orgs/:id/members returns 401', async () => {
      const res = await request(app).get('/api/orgs/org-1/members');
      expect(res.status).toBe(401);
    });
  });
});
