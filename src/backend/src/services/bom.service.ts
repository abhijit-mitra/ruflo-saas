import { PrismaClient, BOMPriority } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import {
  CreateBOMInput,
  UpdateBOMInput,
  CreateBOMProductInput,
  UpdateBOMProductInput,
} from '../utils/validation';
import { generateNumber } from '../utils/numbering';
import { parsePDF, parseExcel } from '../utils/file-parser';
import { fileManagementService } from './file-management.service';

const prisma = new PrismaClient();

export class BOMService {
  async create(projectId: string, userId: string, data: CreateBOMInput) {
    const bomNumber = await generateNumber('BOM');

    const bom = await prisma.billOfMaterials.create({
      data: {
        projectId,
        name: data.name,
        bomNumber,
        branchLocation: data.branchLocation,
        opportunityId: data.opportunityId,
        isPrimary: data.isPrimary ?? false,
        priority: (data.priority as BOMPriority) || 'primary',
        primaryCompany: data.primaryCompany,
        primaryContact: data.primaryContact,
        outsideSales: data.outsideSales,
        createdById: userId,
        secondaryCustomers: data.secondaryCustomers
          ? {
              create: data.secondaryCustomers.map((sc) => ({
                company: sc.company,
                contact: sc.contact,
              })),
            }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        secondaryCustomers: true,
      },
    });

    return bom;
  }

  async list(projectId: string) {
    return prisma.billOfMaterials.findMany({
      where: { projectId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(projectId: string, bomId: string) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: bomId, projectId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        sourceFile: true,
        products: { orderBy: { sortOrder: 'asc' } },
        secondaryCustomers: true,
      },
    });

    if (!bom) {
      throw new AppError(404, 'BOM_NOT_FOUND', 'Bill of Materials not found');
    }

    return bom;
  }

  async update(projectId: string, bomId: string, data: UpdateBOMInput) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: bomId, projectId },
    });
    if (!bom) {
      throw new AppError(404, 'BOM_NOT_FOUND', 'Bill of Materials not found');
    }

    // Handle secondary customers update if provided
    if (data.secondaryCustomers !== undefined) {
      await prisma.bOMSecondaryCustomer.deleteMany({ where: { bomId } });
      if (data.secondaryCustomers.length > 0) {
        await prisma.bOMSecondaryCustomer.createMany({
          data: data.secondaryCustomers.map((sc) => ({
            bomId,
            company: sc.company,
            contact: sc.contact,
          })),
        });
      }
    }

    const { secondaryCustomers: _, ...updateData } = data;

    const updated = await prisma.billOfMaterials.update({
      where: { id: bomId },
      data: {
        ...(updateData.name !== undefined && { name: updateData.name }),
        ...(updateData.branchLocation !== undefined && { branchLocation: updateData.branchLocation }),
        ...(updateData.opportunityId !== undefined && { opportunityId: updateData.opportunityId }),
        ...(updateData.isPrimary !== undefined && { isPrimary: updateData.isPrimary }),
        ...(updateData.priority !== undefined && { priority: updateData.priority as BOMPriority }),
        ...(updateData.primaryCompany !== undefined && { primaryCompany: updateData.primaryCompany }),
        ...(updateData.primaryContact !== undefined && { primaryContact: updateData.primaryContact }),
        ...(updateData.outsideSales !== undefined && { outsideSales: updateData.outsideSales }),
        ...(updateData.status !== undefined && { status: updateData.status }),
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        secondaryCustomers: true,
      },
    });

    return updated;
  }

  async delete(projectId: string, bomId: string) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: bomId, projectId },
    });
    if (!bom) {
      throw new AppError(404, 'BOM_NOT_FOUND', 'Bill of Materials not found');
    }

    await prisma.billOfMaterials.delete({ where: { id: bomId } });
  }

  async addProduct(bomId: string, data: CreateBOMProductInput) {
    const bom = await prisma.billOfMaterials.findUnique({ where: { id: bomId } });
    if (!bom) {
      throw new AppError(404, 'BOM_NOT_FOUND', 'Bill of Materials not found');
    }

    return prisma.bOMProduct.create({
      data: {
        bomId,
        type: data.type,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        quantity: data.quantity ?? 1,
        description: data.description,
        cost: data.cost ?? 0,
        discount: data.discount ?? 0,
        margin: data.margin ?? 0,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateProduct(bomId: string, productId: string, data: UpdateBOMProductInput) {
    const product = await prisma.bOMProduct.findFirst({
      where: { id: productId, bomId },
    });
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    return prisma.bOMProduct.update({
      where: { id: productId },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
        ...(data.modelNumber !== undefined && { modelNumber: data.modelNumber }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.margin !== undefined && { margin: data.margin }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async deleteProduct(bomId: string, productId: string) {
    const product = await prisma.bOMProduct.findFirst({
      where: { id: productId, bomId },
    });
    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }

    await prisma.bOMProduct.delete({ where: { id: productId } });
  }

  async importFile(
    projectId: string,
    userId: string,
    bomId: string,
    file: Express.Multer.File
  ) {
    const bom = await prisma.billOfMaterials.findFirst({
      where: { id: bomId, projectId },
    });
    if (!bom) {
      throw new AppError(404, 'BOM_NOT_FOUND', 'Bill of Materials not found');
    }

    // Save file to project file management in "BOM Imports" folder
    const folder = await fileManagementService.getOrCreateBOMImportsFolder(projectId, userId);
    const projectFile = await fileManagementService.createFileRecord(
      projectId,
      userId,
      file,
      folder.id
    );

    // Link the file as source on the BOM
    await prisma.billOfMaterials.update({
      where: { id: bomId },
      data: { sourceFileId: projectFile.id },
    });

    // Extract products from file
    const buffer = require('fs').readFileSync(file.path);
    let parsedProducts;

    const mime = file.mimetype.toLowerCase();
    if (
      mime === 'application/pdf'
    ) {
      parsedProducts = await parsePDF(buffer);
    } else if (
      mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mime === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      parsedProducts = await parseExcel(buffer);
    } else {
      throw new AppError(
        400,
        'UNSUPPORTED_FILE_TYPE',
        'Only PDF and Excel files are supported for BOM import'
      );
    }

    // Create BOMProduct records
    const products = [];
    for (let i = 0; i < parsedProducts.length; i++) {
      const pp = parsedProducts[i];
      const product = await prisma.bOMProduct.create({
        data: {
          bomId,
          type: pp.type || null,
          manufacturer: pp.manufacturer || null,
          modelNumber: pp.modelNumber || null,
          quantity: pp.quantity ?? 1,
          description: pp.description || null,
          cost: pp.cost ?? 0,
          sortOrder: i,
        },
      });
      products.push(product);
    }

    return { file: projectFile, products };
  }
}

export const bomService = new BOMService();
