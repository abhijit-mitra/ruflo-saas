import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaInvoice, mockPrismaInvoiceLineItem, mockPrismaQuote, mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaInvoice: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaInvoiceLineItem: { deleteMany: vi.fn() },
  mockPrismaQuote: { findUnique: vi.fn() },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    invoice: mockPrismaInvoice,
    invoiceLineItem: mockPrismaInvoiceLineItem,
    quote: mockPrismaQuote,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'INV-2026-0001'),
}));

import { InvoiceService } from '../../../src/services/invoice.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('InvoiceService', () => {
  let service: InvoiceService;

  const mockInvoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-0001',
    quoteId: null,
    projectId: 'proj-1',
    status: 'draft',
    subtotal: 1850,
    tax: 0,
    total: 1850,
    amountPaid: 0,
    amountDue: 1850,
    dueDate: new Date('2026-06-15'),
    sentAt: null,
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InvoiceService();
  });

  describe('create', () => {
    it('creates an invoice with auto number', async () => {
      mockPrismaInvoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create('proj-1', 'user-1', {
        lineItems: [
          { description: 'Drywall Installation', quantity: 100, unitPrice: 12.50 },
          { description: 'Paint Labor', quantity: 8, unitPrice: 75 },
        ],
        dueDate: '2026-06-15T00:00:00.000Z',
      });

      expect(result.invoiceNumber).toBe('INV-2026-0001');
      expect(result.status).toBe('draft');
    });

    it('populates from quote when quoteId given and no lineItems', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({
        id: 'quote-1',
        total: 1850,
        lineItems: [{ description: 'Drywall', quantity: 100, unit: 'sqft', unitPrice: 12.50, totalPrice: 1250 }],
      });
      mockPrismaInvoice.create.mockResolvedValue(mockInvoice);

      await service.create('proj-1', 'user-1', { quoteId: 'quote-1' });
      expect(mockPrismaQuote.findUnique).toHaveBeenCalled();
    });
  });

  describe('send', () => {
    it('marks invoice as sent with timestamp', async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(mockInvoice);
      mockPrismaInvoice.update.mockResolvedValue({ ...mockInvoice, status: 'sent', sentAt: new Date() });

      const result = await service.send('inv-1');
      expect(result.status).toBe('sent');
    });

    it('throws if not in draft status', async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue({ ...mockInvoice, status: 'sent' });
      await expect(service.send('inv-1')).rejects.toThrow('Invoice must be in draft status to send');
    });
  });

  describe('recordPayment', () => {
    it('updates amountPaid and amountDue', async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue({ ...mockInvoice, status: 'sent' });
      mockPrismaInvoice.update.mockResolvedValue({ ...mockInvoice, amountPaid: 1000, amountDue: 850, status: 'sent' });

      const result = await service.recordPayment('inv-1', 1000);
      expect(result.amountPaid).toBe(1000);
    });

    it('marks invoice as paid when fully paid', async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue({ ...mockInvoice, status: 'sent' });
      mockPrismaInvoice.update.mockResolvedValue({ ...mockInvoice, amountPaid: 1850, amountDue: 0, status: 'paid' });

      const result = await service.recordPayment('inv-1', 1850);
      expect(result.status).toBe('paid');
    });

    it('throws for non-existent invoice', async () => {
      mockPrismaInvoice.findUnique.mockResolvedValue(null);
      await expect(service.recordPayment('non-existent', 500)).rejects.toThrow('Invoice not found');
    });
  });
});
