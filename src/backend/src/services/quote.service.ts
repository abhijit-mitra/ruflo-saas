import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateQuoteInput, UpdateQuoteInput } from '../utils/validation';
import { generateNumber } from '../utils/numbering';

const prisma = new PrismaClient();

function calcTotals(lineItems: { quantity: number; unitPrice: number }[], tax = 0, discount = 0) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const total = subtotal + tax - discount;
  return { subtotal, total };
}

export class QuoteService {
  async create(projectId: string, userId: string, data: CreateQuoteInput) {
    const quoteNumber = await generateNumber('QUO');
    const items = data.lineItems || [];
    const { subtotal, total } = calcTotals(items, data.tax, data.discount);

    const quote = await prisma.quote.create({
      data: {
        projectId,
        quoteNumber,
        createdById: userId,
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        discount: data.discount || 0,
        tax: data.tax || 0,
        subtotal,
        total,
        lineItems: {
          create: items.map((li, idx) => ({
            description: li.description,
            category: li.category,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.quantity * li.unitPrice,
            manufacturer: li.manufacturer,
            partNumber: li.partNumber,
            notes: li.notes,
            sortOrder: li.sortOrder ?? idx,
          })),
        },
      },
      include: { lineItems: true },
    });

    return quote;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { projectId },
        include: { _count: { select: { lineItems: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quote.count({ where: { projectId } }),
    ]);
    return { quotes, total, page, limit };
  }

  async getById(id: string) {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        lineItems: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
    return quote;
  }

  async update(id: string, data: UpdateQuoteInput) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
    if (quote.status !== 'draft') {
      throw new AppError(400, 'QUOTE_NOT_EDITABLE', 'Only draft quotes can be edited');
    }

    const updatedData: any = {};
    if (data.notes !== undefined) updatedData.notes = data.notes;
    if (data.validUntil !== undefined) updatedData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.discount !== undefined) updatedData.discount = data.discount;
    if (data.tax !== undefined) updatedData.tax = data.tax;

    if (data.lineItems !== undefined) {
      const { subtotal, total } = calcTotals(data.lineItems, data.tax ?? Number(quote.tax), data.discount ?? Number(quote.discount));
      updatedData.subtotal = subtotal;
      updatedData.total = total;

      return prisma.$transaction(async (tx) => {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });
        return tx.quote.update({
          where: { id },
          data: {
            ...updatedData,
            lineItems: {
              create: data.lineItems!.map((li, idx) => ({
                description: li.description,
                category: li.category,
                quantity: li.quantity,
                unit: li.unit,
                unitPrice: li.unitPrice,
                totalPrice: li.quantity * li.unitPrice,
                manufacturer: li.manufacturer,
                partNumber: li.partNumber,
                notes: li.notes,
                sortOrder: li.sortOrder ?? idx,
              })),
            },
          },
          include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
        });
      });
    }

    return prisma.quote.update({
      where: { id },
      data: updatedData,
      include: { lineItems: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async submit(id: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
    if (quote.status !== 'draft') throw new AppError(400, 'INVALID_STATUS', 'Quote must be in draft status');

    return prisma.quote.update({
      where: { id },
      data: { status: 'submitted', submittedAt: new Date() },
    });
  }

  async win(id: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
    if (quote.status !== 'submitted') throw new AppError(400, 'INVALID_STATUS', 'Quote must be submitted first');

    return prisma.quote.update({ where: { id }, data: { status: 'won' } });
  }

  async lose(id: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');
    if (quote.status !== 'submitted') throw new AppError(400, 'INVALID_STATUS', 'Quote must be submitted first');

    return prisma.quote.update({ where: { id }, data: { status: 'lost' } });
  }

  async revise(id: string, userId: string) {
    const original = await prisma.quote.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!original) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found');

    // Mark original as revised
    await prisma.quote.update({ where: { id }, data: { status: 'revised' } });

    const quoteNumber = await generateNumber('QUO');
    const newQuote = await prisma.quote.create({
      data: {
        projectId: original.projectId,
        quoteNumber,
        version: original.version + 1,
        createdById: userId,
        notes: original.notes,
        validUntil: original.validUntil,
        discount: original.discount,
        tax: original.tax,
        subtotal: original.subtotal,
        total: original.total,
        lineItems: {
          create: original.lineItems.map((li) => ({
            description: li.description,
            category: li.category,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            totalPrice: li.totalPrice,
            manufacturer: li.manufacturer,
            partNumber: li.partNumber,
            notes: li.notes,
            sortOrder: li.sortOrder,
          })),
        },
      },
      include: { lineItems: true },
    });

    return newQuote;
  }
}

export const quoteService = new QuoteService();
