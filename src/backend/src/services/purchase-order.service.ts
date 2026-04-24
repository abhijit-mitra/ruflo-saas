import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreatePurchaseOrderInput, UpdatePurchaseOrderInput } from '../utils/validation';
import { generateNumber } from '../utils/numbering';

const prisma = new PrismaClient();

export class PurchaseOrderService {
  async create(projectId: string, userId: string, data: CreatePurchaseOrderInput) {
    const poNumber = await generateNumber('PO');
    const items = data.lineItems || [];
    const subtotal = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    const tax = data.tax || 0;
    const total = subtotal + tax;

    const po = await prisma.purchaseOrder.create({
      data: {
        projectId,
        poNumber,
        vendorName: data.vendorName,
        vendorEmail: data.vendorEmail,
        vendorAddress: data.vendorAddress,
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        notes: data.notes,
        subtotal,
        tax,
        total,
        createdById: userId,
        lineItems: {
          create: items.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.quantity * li.unitPrice,
            manufacturer: li.manufacturer,
            partNumber: li.partNumber,
          })),
        },
      },
      include: { lineItems: true },
    });

    return po;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchaseOrder.count({ where: { projectId } }),
    ]);
    return { purchaseOrders, total, page, limit };
  }

  async getById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        lineItems: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!po) throw new AppError(404, 'PO_NOT_FOUND', 'Purchase order not found');
    return po;
  }

  async update(id: string, data: UpdatePurchaseOrderInput) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError(404, 'PO_NOT_FOUND', 'Purchase order not found');
    if (po.status !== 'draft') {
      throw new AppError(400, 'NOT_EDITABLE', 'Only draft purchase orders can be edited');
    }

    const updateData: any = {};
    if (data.vendorName !== undefined) updateData.vendorName = data.vendorName;
    if (data.vendorEmail !== undefined) updateData.vendorEmail = data.vendorEmail;
    if (data.vendorAddress !== undefined) updateData.vendorAddress = data.vendorAddress;
    if (data.expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tax !== undefined) updateData.tax = data.tax;

    if (data.lineItems !== undefined) {
      const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
      const tax = data.tax ?? Number(po.tax);
      updateData.subtotal = subtotal;
      updateData.total = subtotal + tax;

      return prisma.$transaction(async (tx) => {
        await tx.purchaseOrderLineItem.deleteMany({ where: { purchaseOrderId: id } });
        return tx.purchaseOrder.update({
          where: { id },
          data: {
            ...updateData,
            lineItems: {
              create: data.lineItems!.map((li) => ({
                description: li.description,
                quantity: li.quantity,
                unit: li.unit,
                unitPrice: li.unitPrice,
                totalPrice: li.quantity * li.unitPrice,
                manufacturer: li.manufacturer,
                partNumber: li.partNumber,
              })),
            },
          },
          include: { lineItems: true },
        });
      });
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  async send(id: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new AppError(404, 'PO_NOT_FOUND', 'Purchase order not found');
    if (po.status !== 'draft') {
      throw new AppError(400, 'INVALID_STATUS', 'Purchase order must be in draft status to send');
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'sent' },
    });
  }
}

export const purchaseOrderService = new PurchaseOrderService();
