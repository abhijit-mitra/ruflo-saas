import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaSalesOrder, mockPrismaSOLineItem, mockPrismaQuote, mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaSalesOrder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaSOLineItem: { deleteMany: vi.fn() },
  mockPrismaQuote: { findUnique: vi.fn() },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    salesOrder: mockPrismaSalesOrder,
    salesOrderLineItem: mockPrismaSOLineItem,
    quote: mockPrismaQuote,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'SO-2026-0001'),
}));

import { SalesOrderService } from '../../../src/services/sales-order.service';

describe('SalesOrderService', () => {
  let service: SalesOrderService;

  const mockQuote = {
    id: 'quote-1',
    projectId: 'proj-1',
    status: 'won',
    total: 1850,
    lineItems: [{ description: 'Drywall', quantity: 100, unit: 'sqft', unitPrice: 12.50, totalPrice: 1250 }],
  };

  const mockSO = {
    id: 'so-1',
    soNumber: 'SO-2026-0001',
    quoteId: 'quote-1',
    projectId: 'proj-1',
    customerName: 'Acme Corp',
    status: 'draft',
    subtotal: 1250,
    tax: 0,
    total: 1250,
    notes: '',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: mockQuote.lineItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SalesOrderService();
  });

  describe('create', () => {
    it('creates a sales order from quote', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaSalesOrder.create.mockResolvedValue(mockSO);

      const result = await service.create('proj-1', 'user-1', {
        quoteId: 'quote-1',
        customerName: 'Acme Corp',
      });

      expect(result.soNumber).toBe('SO-2026-0001');
      expect(result.quoteId).toBe('quote-1');
    });

    it('creates with explicit line items', async () => {
      mockPrismaSalesOrder.create.mockResolvedValue(mockSO);

      const result = await service.create('proj-1', 'user-1', {
        customerName: 'Acme Corp',
        lineItems: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
      });

      expect(result.soNumber).toBe('SO-2026-0001');
    });
  });

  describe('listByProject', () => {
    it('returns paginated sales orders', async () => {
      mockPrismaSalesOrder.findMany.mockResolvedValue([mockSO]);
      mockPrismaSalesOrder.count.mockResolvedValue(1);

      const result = await service.listByProject('proj-1', 1, 10);
      expect(result.salesOrders).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns sales order with line items', async () => {
      mockPrismaSalesOrder.findUnique.mockResolvedValue(mockSO);
      const result = await service.getById('so-1');
      expect(result.id).toBe('so-1');
    });

    it('throws 404 for non-existent SO', async () => {
      mockPrismaSalesOrder.findUnique.mockResolvedValue(null);
      await expect(service.getById('non-existent')).rejects.toThrow('Sales order not found');
    });
  });

  describe('confirm', () => {
    it('marks sales order as confirmed', async () => {
      mockPrismaSalesOrder.findUnique.mockResolvedValue(mockSO);
      mockPrismaSalesOrder.update.mockResolvedValue({ ...mockSO, status: 'confirmed' });

      const result = await service.confirm('so-1');
      expect(result.status).toBe('confirmed');
    });

    it('throws if not in draft status', async () => {
      mockPrismaSalesOrder.findUnique.mockResolvedValue({ ...mockSO, status: 'confirmed' });
      await expect(service.confirm('so-1')).rejects.toThrow('Sales order must be in draft status to confirm');
    });
  });
});
