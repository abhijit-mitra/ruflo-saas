import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateSalesOrderInput, UpdateSalesOrderInput } from '../utils/validation';
import { generateNumber } from '../utils/numbering';

const prisma = new PrismaClient();

export class SalesOrderService {
  async create(projectId: string, userId: string, data: CreateSalesOrderInput) {
    const soNumber = await generateNumber('SO');
    let lineItems = data.lineItems || [];

    // Auto-populate from quote if provided and no lineItems
    if (data.quoteId && lineItems.length === 0) {
      const quote = await prisma.quote.findUnique({
        where: { id: data.quoteId },
        include: { lineItems: true },
      });
      if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
      lineItems = quote.lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity),
        unit: li.unit || undefined,
        unitPrice: Number(li.unitPrice),
      }));
    }

    const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    const tax = data.tax || 0;
    const total = subtotal + tax;

    const so = await prisma.salesOrder.create({
      data: {
        projectId,
        quoteId: data.quoteId,
        soNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        notes: data.notes,
        subtotal,
        tax,
        total,
        createdById: userId,
        lineItems: {
          create: lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.quantity * li.unitPrice,
          })),
        },
      },
      include: { lineItems: true },
    });

    return so;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [salesOrders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.count({ where: { projectId } }),
    ]);
    return { salesOrders, total, page, limit };
  }

  async getById(id: string) {
    const so = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        lineItems: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!so) throw new AppError(404, 'SO_NOT_FOUND', 'Sales order not found');
    return so;
  }

  async update(id: string, data: UpdateSalesOrderInput) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new AppError(404, 'SO_NOT_FOUND', 'Sales order not found');
    if (so.status !== 'draft') {
      throw new AppError(400, 'NOT_EDITABLE', 'Only draft sales orders can be edited');
    }

    const updateData: any = {};
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
    if (data.customerAddress !== undefined) updateData.customerAddress = data.customerAddress;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tax !== undefined) updateData.tax = data.tax;

    if (data.lineItems !== undefined) {
      const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
      const tax = data.tax ?? Number(so.tax);
      updateData.subtotal = subtotal;
      updateData.total = subtotal + tax;

      return prisma.$transaction(async (tx) => {
        await tx.salesOrderLineItem.deleteMany({ where: { salesOrderId: id } });
        return tx.salesOrder.update({
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
              })),
            },
          },
          include: { lineItems: true },
        });
      });
    }

    return prisma.salesOrder.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  async confirm(id: string) {
    const so = await prisma.salesOrder.findUnique({ where: { id } });
    if (!so) throw new AppError(404, 'SO_NOT_FOUND', 'Sales order not found');
    if (so.status !== 'draft') {
      throw new AppError(400, 'INVALID_STATUS', 'Sales order must be in draft status to confirm');
    }

    return prisma.salesOrder.update({
      where: { id },
      data: { status: 'confirmed' },
    });
  }
}

export const salesOrderService = new SalesOrderService();
