import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaChangeOrder, mockPrismaChangeOrderLineItem, mockPrismaQuote, mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaChangeOrder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaChangeOrderLineItem: { deleteMany: vi.fn() },
  mockPrismaQuote: { findUnique: vi.fn() },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    changeOrder: mockPrismaChangeOrder,
    changeOrderLineItem: mockPrismaChangeOrderLineItem,
    quote: mockPrismaQuote,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'CO-2026-0001'),
}));

import { ChangeOrderService } from '../../../src/services/change-order.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('ChangeOrderService', () => {
  let service: ChangeOrderService;

  const mockQuote = { id: 'quote-1', projectId: 'proj-1', status: 'won', total: 1850, lineItems: [] };

  const mockCO = {
    id: 'co-1',
    changeOrderNumber: 'CO-2026-0001',
    quoteId: 'quote-1',
    projectId: 'proj-1',
    type: 'customer',
    description: 'Additional work',
    status: 'draft',
    originalAmount: 1850,
    revisedAmount: 2350,
    difference: 500,
    createdById: 'user-1',
    approvedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChangeOrderService();
  });

  describe('create', () => {
    it('creates a change order with auto-diff from quote', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaChangeOrder.create.mockResolvedValue(mockCO);

      const result = await service.create('proj-1', 'user-1', {
        quoteId: 'quote-1',
        type: 'customer',
        description: 'Additional work',
        revisedAmount: 2350,
      });

      expect(result.changeOrderNumber).toBe('CO-2026-0001');
    });

    it('throws if quote not found', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(null);

      await expect(
        service.create('proj-1', 'user-1', {
          quoteId: 'non-existent',
          type: 'customer',
          description: 'Changes',
          revisedAmount: 2000,
        }),
      ).rejects.toThrow('Original quote not found');
    });
  });

  describe('approve', () => {
    it('changes status and sets approvedBy', async () => {
      mockPrismaChangeOrder.findUnique.mockResolvedValue(mockCO);
      mockPrismaChangeOrder.update.mockResolvedValue({ ...mockCO, status: 'approved', approvedById: 'user-2' });

      const result = await service.approve('co-1', 'user-2');
      expect(result.status).toBe('approved');
    });

    it('throws 404 for non-existent change order', async () => {
      mockPrismaChangeOrder.findUnique.mockResolvedValue(null);
      await expect(service.approve('non-existent', 'user-2')).rejects.toThrow('Change order not found');
    });
  });

  describe('reject', () => {
    it('changes status to rejected', async () => {
      mockPrismaChangeOrder.findUnique.mockResolvedValue(mockCO);
      mockPrismaChangeOrder.update.mockResolvedValue({ ...mockCO, status: 'rejected' });

      const result = await service.reject('co-1', 'user-2');
      expect(result.status).toBe('rejected');
    });
  });
});
