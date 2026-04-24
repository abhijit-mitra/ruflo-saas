import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaQuote, mockPrismaQuoteLineItem, mockPrismaTransaction } = vi.hoisted(() => ({
  mockPrismaQuote: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaQuoteLineItem: { deleteMany: vi.fn() },
  mockPrismaTransaction: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    quote: mockPrismaQuote,
    quoteLineItem: mockPrismaQuoteLineItem,
    $transaction: mockPrismaTransaction,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'QUO-2026-0001'),
}));

import { QuoteService } from '../../../src/services/quote.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('QuoteService', () => {
  let service: QuoteService;

  const mockLineItems = [
    { description: 'Drywall Installation', quantity: 100, unit: 'sqft', unitPrice: 12.50 },
    { description: 'Paint Labor', quantity: 8, unit: 'hours', unitPrice: 75.00 },
  ];

  const mockQuote = {
    id: 'quote-1',
    quoteNumber: 'QUO-2026-0001',
    projectId: 'proj-1',
    version: 1,
    status: 'draft',
    subtotal: 1850.00,
    tax: 0,
    discount: 0,
    total: 1850.00,
    notes: '',
    validUntil: new Date('2026-06-01'),
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    lineItems: mockLineItems,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new QuoteService();
  });

  describe('create', () => {
    it('creates a quote with line items and auto-generated number', async () => {
      mockPrismaQuote.create.mockResolvedValue(mockQuote);

      const result = await service.create('proj-1', 'user-1', {
        lineItems: mockLineItems,
        validUntil: '2026-06-01T00:00:00.000Z',
      });

      expect(result.quoteNumber).toBe('QUO-2026-0001');
      expect(mockPrismaQuote.create).toHaveBeenCalled();
    });

    it('sets initial status to draft', async () => {
      mockPrismaQuote.create.mockResolvedValue(mockQuote);
      const result = await service.create('proj-1', 'user-1', {});
      expect(result.status).toBe('draft');
    });
  });

  describe('getById', () => {
    it('returns quote with line items', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(mockQuote);
      const result = await service.getById('quote-1');
      expect(result.id).toBe('quote-1');
    });

    it('throws 404 for non-existent quote', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(null);
      await expect(service.getById('non-existent')).rejects.toThrow('Quote not found');
    });
  });

  describe('submit', () => {
    it('changes status to submitted', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue(mockQuote);
      mockPrismaQuote.update.mockResolvedValue({ ...mockQuote, status: 'submitted' });
      const result = await service.submit('quote-1');
      expect(result.status).toBe('submitted');
    });

    it('throws if quote is not in draft status', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({ ...mockQuote, status: 'won' });
      await expect(service.submit('quote-1')).rejects.toThrow('Quote must be in draft status');
    });
  });

  describe('win', () => {
    it('marks quote as won', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({ ...mockQuote, status: 'submitted' });
      mockPrismaQuote.update.mockResolvedValue({ ...mockQuote, status: 'won' });
      const result = await service.win('quote-1');
      expect(result.status).toBe('won');
    });
  });

  describe('lose', () => {
    it('marks quote as lost', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({ ...mockQuote, status: 'submitted' });
      mockPrismaQuote.update.mockResolvedValue({ ...mockQuote, status: 'lost' });
      const result = await service.lose('quote-1');
      expect(result.status).toBe('lost');
    });
  });

  describe('revise', () => {
    it('creates new version copying line items', async () => {
      const submittedQuote = { ...mockQuote, status: 'submitted', version: 1 };
      mockPrismaQuote.findUnique.mockResolvedValue(submittedQuote);
      mockPrismaQuote.update.mockResolvedValue({ ...submittedQuote, status: 'revised' });
      mockPrismaQuote.create.mockResolvedValue({ ...mockQuote, id: 'quote-2', version: 2, status: 'draft' });

      const result = await service.revise('quote-1', 'user-1');
      expect(result.version).toBe(2);
    });
  });

  describe('update', () => {
    it('throws if quote is not in draft status', async () => {
      mockPrismaQuote.findUnique.mockResolvedValue({ ...mockQuote, status: 'submitted' });
      await expect(service.update('quote-1', { notes: 'Update' })).rejects.toThrow('Only draft quotes can be edited');
    });
  });
});
