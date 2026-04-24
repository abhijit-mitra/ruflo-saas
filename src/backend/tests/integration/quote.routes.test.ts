import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockQuoteService } = vi.hoisted(() => ({
  mockQuoteService: {
    create: vi.fn(),
    listByProject: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    submit: vi.fn(),
    win: vi.fn(),
    lose: vi.fn(),
    revise: vi.fn(),
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
    quoteLineItem: { createMany: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
    rFQDocument: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    changeOrder: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    changeOrderLineItem: { deleteMany: vi.fn() },
    invoice: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    invoiceLineItem: { deleteMany: vi.fn() },
    purchaseOrder: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    purchaseOrderLineItem: { deleteMany: vi.fn() },
    salesOrder: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    salesOrderLineItem: { deleteMany: vi.fn() },
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
  projectService: { create: vi.fn(), list: vi.fn(), getById: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
  ProjectService: vi.fn(),
}));

vi.mock('../../src/services/quote.service', () => ({
  quoteService: mockQuoteService,
  QuoteService: vi.fn().mockImplementation(() => mockQuoteService),
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

describe('Quote routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuote = {
    id: 'quote-1',
    quoteNumber: 'QUO-2026-0001',
    projectId: 'proj-1',
    version: 1,
    status: 'draft',
    subtotal: 1250,
    tax: 0,
    discount: 0,
    total: 1250,
    lineItems: [
      { description: 'Drywall', quantity: 100, unitPrice: 12.50, totalPrice: 1250 },
    ],
  };

  describe('POST /api/projects/:pid/quotes', () => {
    it('returns 201 and creates a quote', async () => {
      mockQuoteService.create.mockResolvedValue(mockQuote);

      const res = await request(app)
        .post('/api/projects/proj-1/quotes')
        .send({
          lineItems: [
            { description: 'Drywall', quantity: 100, unitPrice: 12.50 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.quoteNumber).toBe('QUO-2026-0001');
    });
  });

  describe('GET /api/projects/:pid/quotes/:id', () => {
    it('returns 200 with quote and line items', async () => {
      mockQuoteService.getById.mockResolvedValue(mockQuote);

      const res = await request(app).get('/api/projects/proj-1/quotes/quote-1');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('quote-1');
    });

    it('returns 404 for non-existent quote', async () => {
      mockQuoteService.getById.mockRejectedValue(
        new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found'),
      );

      const res = await request(app).get('/api/projects/proj-1/quotes/non-existent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/projects/:pid/quotes/:id/submit', () => {
    it('returns 200 and submits the quote', async () => {
      mockQuoteService.submit.mockResolvedValue({ ...mockQuote, status: 'submitted' });

      const res = await request(app).post('/api/projects/proj-1/quotes/quote-1/submit');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('submitted');
    });
  });

  describe('POST /api/projects/:pid/quotes/:id/win', () => {
    it('returns 200 and marks quote as won', async () => {
      mockQuoteService.win.mockResolvedValue({ ...mockQuote, status: 'won' });

      const res = await request(app).post('/api/projects/proj-1/quotes/quote-1/win');
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('won');
    });
  });

  describe('POST /api/projects/:pid/quotes/:id/revise', () => {
    it('returns 201 with new version', async () => {
      mockQuoteService.revise.mockResolvedValue({ ...mockQuote, id: 'quote-2', version: 2 });

      const res = await request(app).post('/api/projects/proj-1/quotes/quote-1/revise');
      expect(res.status).toBe(201);
      expect(res.body.data.version).toBe(2);
    });
  });
});
