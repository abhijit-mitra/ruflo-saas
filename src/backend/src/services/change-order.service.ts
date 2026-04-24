import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateChangeOrderInput, UpdateChangeOrderInput } from '../utils/validation';
import { generateNumber } from '../utils/numbering';

const prisma = new PrismaClient();

export class ChangeOrderService {
  async create(projectId: string, userId: string, data: CreateChangeOrderInput) {
    const quote = await prisma.quote.findUnique({ where: { id: data.quoteId } });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Original quote not found');

    const originalAmount = Number(quote.total);
    const difference = data.revisedAmount - originalAmount;
    const changeOrderNumber = await generateNumber('CO');

    const co = await prisma.changeOrder.create({
      data: {
        projectId,
        quoteId: data.quoteId,
        changeOrderNumber,
        type: data.type,
        description: data.description,
        reason: data.reason,
        originalAmount,
        revisedAmount: data.revisedAmount,
        difference,
        createdById: userId,
        lineItems: data.lineItems
          ? {
              create: data.lineItems.map((li) => {
                const origTotal = (li.originalQuantity || 0) * (li.originalUnitPrice || 0);
                const newTotal = (li.newQuantity || 0) * (li.newUnitPrice || 0);
                return {
                  description: li.description,
                  changeType: li.changeType,
                  originalQuantity: li.originalQuantity,
                  originalUnitPrice: li.originalUnitPrice,
                  newQuantity: li.newQuantity,
                  newUnitPrice: li.newUnitPrice,
                  difference: newTotal - origTotal,
                };
              }),
            }
          : undefined,
      },
      include: { lineItems: true },
    });

    return co;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [changeOrders, total] = await Promise.all([
      prisma.changeOrder.findMany({
        where: { projectId },
        include: { _count: { select: { lineItems: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.changeOrder.count({ where: { projectId } }),
    ]);
    return { changeOrders, total, page, limit };
  }

  async getById(id: string) {
    const co = await prisma.changeOrder.findUnique({
      where: { id },
      include: {
        lineItems: true,
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!co) throw new AppError(404, 'CHANGE_ORDER_NOT_FOUND', 'Change order not found');
    return co;
  }

  async update(id: string, data: UpdateChangeOrderInput) {
    const co = await prisma.changeOrder.findUnique({ where: { id } });
    if (!co) throw new AppError(404, 'CHANGE_ORDER_NOT_FOUND', 'Change order not found');
    if (co.status !== 'draft') {
      throw new AppError(400, 'NOT_EDITABLE', 'Only draft change orders can be edited');
    }

    const updateData: any = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.revisedAmount !== undefined) {
      updateData.revisedAmount = data.revisedAmount;
      updateData.difference = data.revisedAmount - Number(co.originalAmount);
    }

    if (data.lineItems !== undefined) {
      return prisma.$transaction(async (tx) => {
        await tx.changeOrderLineItem.deleteMany({ where: { changeOrderId: id } });
        return tx.changeOrder.update({
          where: { id },
          data: {
            ...updateData,
            lineItems: {
              create: data.lineItems!.map((li) => {
                const origTotal = (li.originalQuantity || 0) * (li.originalUnitPrice || 0);
                const newTotal = (li.newQuantity || 0) * (li.newUnitPrice || 0);
                return {
                  description: li.description,
                  changeType: li.changeType,
                  originalQuantity: li.originalQuantity,
                  originalUnitPrice: li.originalUnitPrice,
                  newQuantity: li.newQuantity,
                  newUnitPrice: li.newUnitPrice,
                  difference: newTotal - origTotal,
                };
              }),
            },
          },
          include: { lineItems: true },
        });
      });
    }

    return prisma.changeOrder.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  async approve(id: string, userId: string) {
    const co = await prisma.changeOrder.findUnique({ where: { id } });
    if (!co) throw new AppError(404, 'CHANGE_ORDER_NOT_FOUND', 'Change order not found');
    if (co.status !== 'draft' && co.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Change order cannot be approved in current status');
    }

    return prisma.changeOrder.update({
      where: { id },
      data: { status: 'approved', approvedById: userId, approvedAt: new Date() },
    });
  }

  async reject(id: string, userId: string) {
    const co = await prisma.changeOrder.findUnique({ where: { id } });
    if (!co) throw new AppError(404, 'CHANGE_ORDER_NOT_FOUND', 'Change order not found');
    if (co.status !== 'draft' && co.status !== 'pending') {
      throw new AppError(400, 'INVALID_STATUS', 'Change order cannot be rejected in current status');
    }

    return prisma.changeOrder.update({
      where: { id },
      data: { status: 'rejected', approvedById: userId, approvedAt: new Date() },
    });
  }
}

export const changeOrderService = new ChangeOrderService();
