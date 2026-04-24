import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaBOM, mockPrismaBOMProduct, mockPrismaBOMSecondaryCustomer } = vi.hoisted(() => ({
  mockPrismaBOM: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockPrismaBOMProduct: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mockPrismaBOMSecondaryCustomer: {
    deleteMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    billOfMaterials: mockPrismaBOM,
    bOMProduct: mockPrismaBOMProduct,
    bOMSecondaryCustomer: mockPrismaBOMSecondaryCustomer,
  })),
}));

vi.mock('../../../src/config/env', () => ({
  config: { JWT_SECRET: 'test-secret-key-that-is-at-least-32-chars-long' },
}));

vi.mock('../../../src/utils/numbering', () => ({
  generateNumber: vi.fn(() => 'BOM-2026-0001'),
}));

vi.mock('../../../src/utils/file-parser', () => ({
  parsePDF: vi.fn(),
  parseExcel: vi.fn(),
}));

vi.mock('../../../src/services/file-management.service', () => ({
  fileManagementService: {
    getOrCreateBOMImportsFolder: vi.fn(),
    createFileRecord: vi.fn(),
  },
}));

import { BOMService } from '../../../src/services/bom.service';
import { AppError } from '../../../src/middleware/errorHandler';

describe('BOMService', () => {
  let service: BOMService;

  const mockBOM = {
    id: 'bom-1',
    projectId: 'proj-1',
    name: 'Main BOM',
    bomNumber: 'BOM-2026-0001',
    branchLocation: 'NYC',
    isPrimary: true,
    priority: 'primary',
    primaryCompany: 'Acme Corp',
    primaryContact: 'John Doe',
    outsideSales: null,
    createdById: 'user-1',
    createdBy: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    secondaryCustomers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-1',
    bomId: 'bom-1',
    type: 'equipment',
    manufacturer: 'Carrier',
    modelNumber: 'XR-500',
    quantity: 2,
    description: 'HVAC Unit',
    cost: 5000,
    discount: 0,
    margin: 20,
    sortOrder: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BOMService();
  });

  describe('create', () => {
    it('creates a BOM with auto-generated number', async () => {
      mockPrismaBOM.create.mockResolvedValue(mockBOM);

      const result = await service.create('proj-1', 'user-1', {
        name: 'Main BOM',
        branchLocation: 'NYC',
        isPrimary: true,
        primaryCompany: 'Acme Corp',
        primaryContact: 'John Doe',
      });

      expect(result.bomNumber).toBe('BOM-2026-0001');
      expect(mockPrismaBOM.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            name: 'Main BOM',
            bomNumber: 'BOM-2026-0001',
            createdById: 'user-1',
          }),
        })
      );
    });

    it('creates a BOM with secondary customers', async () => {
      const bomWithSecondary = {
        ...mockBOM,
        secondaryCustomers: [{ company: 'Sub Co', contact: 'Jane' }],
      };
      mockPrismaBOM.create.mockResolvedValue(bomWithSecondary);

      const result = await service.create('proj-1', 'user-1', {
        name: 'Main BOM',
        secondaryCustomers: [{ company: 'Sub Co', contact: 'Jane' }],
      });

      expect(result.secondaryCustomers).toHaveLength(1);
    });
  });

  describe('list', () => {
    it('returns all BOMs for a project', async () => {
      mockPrismaBOM.findMany.mockResolvedValue([mockBOM]);

      const result = await service.list('proj-1');

      expect(result).toHaveLength(1);
      expect(mockPrismaBOM.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('returns empty array when no BOMs exist', async () => {
      mockPrismaBOM.findMany.mockResolvedValue([]);
      const result = await service.list('proj-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('returns BOM with products and secondary customers', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(mockBOM);

      const result = await service.getById('proj-1', 'bom-1');

      expect(result.id).toBe('bom-1');
      expect(mockPrismaBOM.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'bom-1', projectId: 'proj-1' },
        })
      );
    });

    it('throws 404 for non-existent BOM', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(null);

      await expect(service.getById('proj-1', 'non-existent'))
        .rejects.toThrow('Bill of Materials not found');
    });
  });

  describe('update', () => {
    it('updates BOM fields', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(mockBOM);
      const updated = { ...mockBOM, name: 'Updated BOM' };
      mockPrismaBOM.update.mockResolvedValue(updated);

      const result = await service.update('proj-1', 'bom-1', { name: 'Updated BOM' });

      expect(result.name).toBe('Updated BOM');
    });

    it('throws 404 when BOM does not exist', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(null);

      await expect(service.update('proj-1', 'non-existent', { name: 'X' }))
        .rejects.toThrow('Bill of Materials not found');
    });

    it('replaces secondary customers when provided', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(mockBOM);
      mockPrismaBOM.update.mockResolvedValue(mockBOM);

      await service.update('proj-1', 'bom-1', {
        secondaryCustomers: [{ company: 'New Co', contact: 'Bob' }],
      });

      expect(mockPrismaBOMSecondaryCustomer.deleteMany).toHaveBeenCalledWith({
        where: { bomId: 'bom-1' },
      });
      expect(mockPrismaBOMSecondaryCustomer.createMany).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes an existing BOM', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(mockBOM);
      mockPrismaBOM.delete.mockResolvedValue(mockBOM);

      await service.delete('proj-1', 'bom-1');

      expect(mockPrismaBOM.delete).toHaveBeenCalledWith({ where: { id: 'bom-1' } });
    });

    it('throws 404 when BOM does not exist', async () => {
      mockPrismaBOM.findFirst.mockResolvedValue(null);

      await expect(service.delete('proj-1', 'non-existent'))
        .rejects.toThrow('Bill of Materials not found');
    });
  });

  describe('addProduct', () => {
    it('adds a product to an existing BOM', async () => {
      mockPrismaBOM.findUnique.mockResolvedValue(mockBOM);
      mockPrismaBOMProduct.create.mockResolvedValue(mockProduct);

      const result = await service.addProduct('bom-1', {
        type: 'equipment',
        manufacturer: 'Carrier',
        modelNumber: 'XR-500',
        quantity: 2,
        description: 'HVAC Unit',
        cost: 5000,
        margin: 20,
      });

      expect(result.id).toBe('prod-1');
      expect(mockPrismaBOMProduct.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bomId: 'bom-1',
            manufacturer: 'Carrier',
          }),
        })
      );
    });

    it('throws 404 when BOM does not exist', async () => {
      mockPrismaBOM.findUnique.mockResolvedValue(null);

      await expect(service.addProduct('non-existent', {
        type: 'equipment',
        manufacturer: 'Carrier',
        modelNumber: 'XR-500',
      })).rejects.toThrow('Bill of Materials not found');
    });

    it('uses default values for optional fields', async () => {
      mockPrismaBOM.findUnique.mockResolvedValue(mockBOM);
      mockPrismaBOMProduct.create.mockResolvedValue(mockProduct);

      await service.addProduct('bom-1', {
        type: 'material',
        manufacturer: 'Generic',
        modelNumber: 'M-100',
      });

      expect(mockPrismaBOMProduct.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 1,
            cost: 0,
            discount: 0,
            margin: 0,
            sortOrder: 0,
          }),
        })
      );
    });
  });

  describe('updateProduct', () => {
    it('updates product fields', async () => {
      mockPrismaBOMProduct.findFirst.mockResolvedValue(mockProduct);
      const updated = { ...mockProduct, quantity: 5 };
      mockPrismaBOMProduct.update.mockResolvedValue(updated);

      const result = await service.updateProduct('bom-1', 'prod-1', { quantity: 5 });

      expect(result.quantity).toBe(5);
    });

    it('throws 404 for non-existent product', async () => {
      mockPrismaBOMProduct.findFirst.mockResolvedValue(null);

      await expect(service.updateProduct('bom-1', 'non-existent', { quantity: 5 }))
        .rejects.toThrow('Product not found');
    });
  });

  describe('deleteProduct', () => {
    it('deletes an existing product', async () => {
      mockPrismaBOMProduct.findFirst.mockResolvedValue(mockProduct);
      mockPrismaBOMProduct.delete.mockResolvedValue(mockProduct);

      await service.deleteProduct('bom-1', 'prod-1');

      expect(mockPrismaBOMProduct.delete).toHaveBeenCalledWith({ where: { id: 'prod-1' } });
    });

    it('throws 404 for non-existent product', async () => {
      mockPrismaBOMProduct.findFirst.mockResolvedValue(null);

      await expect(service.deleteProduct('bom-1', 'non-existent'))
        .rejects.toThrow('Product not found');
    });
  });
});
