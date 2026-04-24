import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockProjectService } = vi.hoisted(() => ({
  mockProjectService: {
    create: vi.fn(),
    list: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  },
}));

vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    user: { findUnique: vi.fn() },
    refreshToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn() },
    orgMembership: { findUnique: vi.fn() },
    project: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    quote: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    rFQDocument: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    changeOrder: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    changeOrderLineItem: { deleteMany: vi.fn() },
    invoice: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    invoiceLineItem: { deleteMany: vi.fn() },
    purchaseOrder: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    purchaseOrderLineItem: { deleteMany: vi.fn() },
    salesOrder: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    salesOrderLineItem: { deleteMany: vi.fn() },
    quoteLineItem: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  })),
  OrgRole: { owner: 'owner', admin: 'admin', member: 'member', user: 'user' },
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

vi.mock('../../src/services/auth.service', () => {
  const mockService = { signup: vi.fn(), login: vi.fn(), logout: vi.fn(), refreshToken: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() };
  return { authService: mockService, AuthService: vi.fn().mockImplementation(() => mockService) };
});

vi.mock('../../src/services/email.service', () => ({
  emailService: { sendPasswordReset: vi.fn(), sendInvitation: vi.fn() },
}));

vi.mock('../../src/services/project.service', () => ({
  projectService: mockProjectService,
  ProjectService: vi.fn().mockImplementation(() => mockProjectService),
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

vi.mock('../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'NUM-2026-0001'),
}));

vi.mock('../../src/middleware/authenticate', () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => {
    req.user = { userId: 'user-1' };
    next();
  }),
}));

import app from '../../src/app';
import { AppError } from '../../src/middleware/errorHandler';

describe('Project routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('returns 201 and creates a project', async () => {
      mockProjectService.create.mockResolvedValue({
        id: 'proj-1',
        name: 'Office Renovation',
        status: 'draft',
        orgId: 'org-1',
      });

      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Office Renovation', orgId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Office Renovation');
    });

    it('returns 400 with invalid body', async () => {
      const res = await request(app).post('/api/projects').send({});
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('returns 200 with project details', async () => {
      mockProjectService.getById.mockResolvedValue({
        id: 'proj-1',
        name: 'Office Renovation',
        status: 'draft',
      });

      const res = await request(app).get('/api/projects/proj-1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('proj-1');
    });

    it('returns 404 for non-existent project', async () => {
      mockProjectService.getById.mockRejectedValue(
        new AppError(404, 'PROJECT_NOT_FOUND', 'Project not found'),
      );

      const res = await request(app).get('/api/projects/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('returns 200 and soft deletes project', async () => {
      mockProjectService.softDelete.mockResolvedValue(undefined);
      const res = await request(app).delete('/api/projects/proj-1');
      expect(res.status).toBe(200);
    });
  });
});
