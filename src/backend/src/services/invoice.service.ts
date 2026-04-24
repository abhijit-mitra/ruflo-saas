import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CreateInvoiceInput, UpdateInvoiceInput } from '../utils/validation';
import { generateNumber } from '../utils/numbering';

const prisma = new PrismaClient();

export class InvoiceService {
  async create(projectId: string, userId: string, data: CreateInvoiceInput) {
    const invoiceNumber = await generateNumber('INV');
    let lineItems = data.lineItems || [];

    // Auto-populate from quote if quoteId provided and no lineItems
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

    const invoice = await prisma.invoice.create({
      data: {
        projectId,
        quoteId: data.quoteId,
        invoiceNumber,
        createdById: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        terms: data.terms,
        notes: data.notes,
        subtotal,
        tax,
        total,
        amountDue: total,
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

    return invoice;
  }

  async listByProject(projectId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: { projectId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where: { projectId } }),
    ]);
    return { invoices, total, page, limit };
  }

  async getById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    if (!invoice) throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
    return invoice;
  }

  async update(id: string, data: UpdateInvoiceInput) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
    if (invoice.status !== 'draft') {
      throw new AppError(400, 'NOT_EDITABLE', 'Only draft invoices can be edited');
    }

    const updateData: any = {};
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tax !== undefined) updateData.tax = data.tax;

    if (data.lineItems !== undefined) {
      const subtotal = data.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
      const tax = data.tax ?? Number(invoice.tax);
      const total = subtotal + tax;
      updateData.subtotal = subtotal;
      updateData.total = total;
      updateData.amountDue = total - Number(invoice.amountPaid);

      return prisma.$transaction(async (tx) => {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        return tx.invoice.update({
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

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  async send(id: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
    if (invoice.status !== 'draft') {
      throw new AppError(400, 'INVALID_STATUS', 'Invoice must be in draft status to send');
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'sent', sentAt: new Date() },
    });
  }

  async recordPayment(id: string, amount: number) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
    if (invoice.status === 'cancelled' || invoice.status === 'paid') {
      throw new AppError(400, 'INVALID_STATUS', 'Cannot record payment for this invoice');
    }

    const newAmountPaid = Number(invoice.amountPaid) + amount;
    const newAmountDue = Number(invoice.total) - newAmountPaid;
    const isPaid = newAmountDue <= 0;

    return prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: isPaid ? 'paid' : invoice.status,
        paidAt: isPaid ? new Date() : undefined,
      },
    });
  }
}

export const invoiceService = new InvoiceService();
