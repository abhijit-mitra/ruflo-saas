import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    quote: { findFirst: mockFindFirst },
    invoice: { findFirst: mockFindFirst },
    purchaseOrder: { findFirst: mockFindFirst },
    salesOrder: { findFirst: mockFindFirst },
    changeOrder: { findFirst: mockFindFirst },
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long',
  },
}));

import { generateNumber } from '../../../src/utils/numbering';

describe('numbering utilities', () => {
  const year = new Date().getFullYear();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateNumber', () => {
    it('generates QUO-YYYY-0001 when no existing quotes', async () => {
      mockFindFirst.mockResolvedValue(null);
      const number = await generateNumber('QUO');
      expect(number).toBe(`QUO-${year}-0001`);
    });

    it('increments from last existing number', async () => {
      mockFindFirst.mockResolvedValue({ quoteNumber: `QUO-${year}-0005` });
      const number = await generateNumber('QUO');
      expect(number).toBe(`QUO-${year}-0006`);
    });

    it('generates INV-YYYY-NNNN format', async () => {
      mockFindFirst.mockResolvedValue(null);
      const number = await generateNumber('INV');
      expect(number).toMatch(/^INV-\d{4}-\d{4}$/);
    });

    it('generates PO-YYYY-NNNN format', async () => {
      mockFindFirst.mockResolvedValue(null);
      const number = await generateNumber('PO');
      expect(number).toMatch(/^PO-\d{4}-\d{4}$/);
    });

    it('generates SO-YYYY-NNNN format', async () => {
      mockFindFirst.mockResolvedValue(null);
      const number = await generateNumber('SO');
      expect(number).toMatch(/^SO-\d{4}-\d{4}$/);
    });

    it('generates CO-YYYY-NNNN format', async () => {
      mockFindFirst.mockResolvedValue(null);
      const number = await generateNumber('CO');
      expect(number).toMatch(/^CO-\d{4}-\d{4}$/);
    });
  });
});
