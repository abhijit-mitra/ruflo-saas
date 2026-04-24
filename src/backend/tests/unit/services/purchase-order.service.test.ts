import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaPurchaseOrder, mockPrismaPOLineItem, mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaPurchaseOrder: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaPOLineItem: { deleteMany: vi.fn() },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    purchaseOrder: mockPrismaPurchaseOrder,
    purchaseOrderLineItem: mockPrismaPOLineItem,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'PO-2026-0001'),
}));

import { PurchaseOrderService } from '../../../src/services/purchase-order.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  const mockPO = {
    id: 'po-1',
    poNumber: 'PO-2026-0001',
    projectId: 'proj-1',
    vendorName: 'Lumber Yard Inc',
    vendorEmail: 'vendor@example.com',
    status: 'draft',
    subtotal: 5000,
    tax: 0,
    total: 5000,
    notes: '',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [
      { description: '2x4 Lumber', quantity: 200, unitPrice: 5, totalPrice: 1000 },
      { description: 'Plywood Sheets', quantity: 50, unitPrice: 80, totalPrice: 4000 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PurchaseOrderService();
  });

  describe('create', () => {
    it('creates a purchase order with auto-generated number', async () => {
      mockPrismaPurchaseOrder.create.mockResolvedValue(mockPO);

      const result = await service.create('proj-1', 'user-1', {
        vendorName: 'Lumber Yard Inc',
        vendorEmail: 'vendor@example.com',
        lineItems: [
          { description: '2x4 Lumber', quantity: 200, unitPrice: 5 },
          { description: 'Plywood Sheets', quantity: 50, unitPrice: 80 },
        ],
      });

      expect(result.poNumber).toBe('PO-2026-0001');
      expect(result.status).toBe('draft');
    });
  });

  describe('listByProject', () => {
    it('returns paginated purchase orders', async () => {
      mockPrismaPurchaseOrder.findMany.mockResolvedValue([mockPO]);
      mockPrismaPurchaseOrder.count.mockResolvedValue(1);

      const result = await service.listByProject('proj-1', 1, 10);
      expect(result.purchaseOrders).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('returns purchase order with line items', async () => {
      mockPrismaPurchaseOrder.findUnique.mockResolvedValue(mockPO);
      const result = await service.getById('po-1');
      expect(result.id).toBe('po-1');
    });

    it('throws 404 for non-existent PO', async () => {
      mockPrismaPurchaseOrder.findUnique.mockResolvedValue(null);
      await expect(service.getById('non-existent')).rejects.toThrow('Purchase order not found');
    });
  });

  describe('send', () => {
    it('marks PO as sent', async () => {
      mockPrismaPurchaseOrder.findUnique.mockResolvedValue(mockPO);
      mockPrismaPurchaseOrder.update.mockResolvedValue({ ...mockPO, status: 'sent' });

      const result = await service.send('po-1');
      expect(result.status).toBe('sent');
    });

    it('throws if not in draft status', async () => {
      mockPrismaPurchaseOrder.findUnique.mockResolvedValue({ ...mockPO, status: 'sent' });
      await expect(service.send('po-1')).rejects.toThrow('Purchase order must be in draft status to send');
    });
  });
});
