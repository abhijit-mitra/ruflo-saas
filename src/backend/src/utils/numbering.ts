import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NumberPrefix = 'QUO' | 'INV' | 'PO' | 'SO' | 'CO';

const tableMap: Record<NumberPrefix, { model: string; field: string }> = {
  QUO: { model: 'quote', field: 'quoteNumber' },
  INV: { model: 'invoice', field: 'invoiceNumber' },
  PO: { model: 'purchaseOrder', field: 'poNumber' },
  SO: { model: 'salesOrder', field: 'soNumber' },
  CO: { model: 'changeOrder', field: 'changeOrderNumber' },
};

export async function generateNumber(prefix: NumberPrefix): Promise<string> {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  const { model, field } = tableMap[prefix];

  // Find highest existing number for this prefix+year
  const latest = await (prisma as any)[model].findFirst({
    where: { [field]: { startsWith: pattern } },
    orderBy: { [field]: 'desc' },
    select: { [field]: true },
  });

  let sequence = 1;
  if (latest) {
    const lastNumber = latest[field] as string;
    const lastSeq = parseInt(lastNumber.split('-')[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${pattern}${String(sequence).padStart(4, '0')}`;
}
