export interface ParsedProduct {
  type?: string;
  manufacturer?: string;
  modelNumber?: string;
  quantity?: number;
  description?: string;
  cost?: number;
}

/**
 * Parse PDF buffer to extract product-like rows.
 * Best-effort heuristic extraction using text patterns.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedProduct[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  const text: string = data.text;

  const products: ParsedProduct[] = [];
  const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

  for (const line of lines) {
    // Skip very short lines or header-like lines
    if (line.length < 5) continue;

    // Try tab-separated pattern first
    const tabParts = line.split('\t').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    if (tabParts.length >= 3) {
      const product = extractFromParts(tabParts);
      if (product) {
        products.push(product);
        continue;
      }
    }

    // Try multi-space separated pattern (2+ spaces)
    const spaceParts = line.split(/\s{2,}/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    if (spaceParts.length >= 3) {
      const product = extractFromParts(spaceParts);
      if (product) {
        products.push(product);
        continue;
      }
    }

    // Try pattern: text followed by a number (quantity/cost)
    const match = line.match(
      /^(.+?)\s+([A-Z0-9][\w-]{2,})\s+(\d+)\s*(.*)$/i
    );
    if (match) {
      const cost = parseCost(match[4]);
      products.push({
        manufacturer: match[1].trim(),
        modelNumber: match[2].trim(),
        quantity: parseInt(match[3], 10) || 1,
        description: match[4]?.trim() || undefined,
        cost: cost ?? undefined,
      });
    }
  }

  return products;
}

function extractFromParts(parts: string[]): ParsedProduct | null {
  // Heuristic: look for a part that looks like a quantity (pure number)
  const quantityIdx = parts.findIndex((p) => /^\d+$/.test(p));
  if (quantityIdx === -1) return null;

  const quantity = parseInt(parts[quantityIdx], 10);
  const remaining = parts.filter((_, i) => i !== quantityIdx);

  // Look for a cost-like value
  let cost: number | undefined;
  const costIdx = remaining.findIndex((p) => /^\$?[\d,]+\.?\d*$/.test(p));
  if (costIdx !== -1) {
    cost = parseCost(remaining[costIdx]) ?? undefined;
    remaining.splice(costIdx, 1);
  }

  if (remaining.length === 0) return null;

  return {
    manufacturer: remaining[0] || undefined,
    modelNumber: remaining[1] || undefined,
    description: remaining.slice(2).join(' ') || undefined,
    quantity,
    cost,
  };
}

function parseCost(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse Excel buffer to extract products from the first sheet.
 * Maps header row columns to product fields.
 */
export async function parseExcel(buffer: Buffer): Promise<ParsedProduct[]> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const XLSX = require('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) return [];

  // Build a column mapping from header names
  const headerKeys = Object.keys(rows[0]);
  const mapping = buildColumnMapping(headerKeys);

  const products: ParsedProduct[] = [];

  for (const row of rows) {
    const product: ParsedProduct = {};
    let hasData = false;

    if (mapping.type) {
      const val = String(row[mapping.type] ?? '').trim();
      if (val) { product.type = val; hasData = true; }
    }
    if (mapping.manufacturer) {
      const val = String(row[mapping.manufacturer] ?? '').trim();
      if (val) { product.manufacturer = val; hasData = true; }
    }
    if (mapping.modelNumber) {
      const val = String(row[mapping.modelNumber] ?? '').trim();
      if (val) { product.modelNumber = val; hasData = true; }
    }
    if (mapping.quantity) {
      const val = parseInt(String(row[mapping.quantity] ?? ''), 10);
      if (!isNaN(val)) { product.quantity = val; hasData = true; }
    }
    if (mapping.description) {
      const val = String(row[mapping.description] ?? '').trim();
      if (val) { product.description = val; hasData = true; }
    }
    if (mapping.cost) {
      const val = parseCost(String(row[mapping.cost] ?? ''));
      if (val !== null) { product.cost = val; hasData = true; }
    }

    if (hasData) {
      products.push(product);
    }
  }

  return products;
}

interface ColumnMapping {
  type?: string;
  manufacturer?: string;
  modelNumber?: string;
  quantity?: string;
  description?: string;
  cost?: string;
}

function buildColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lower = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const h of headers) {
    const norm = lower(h);
    if (!mapping.type && (norm === 'type' || norm === 'category' || norm === 'producttype')) {
      mapping.type = h;
    } else if (!mapping.manufacturer && (norm === 'manufacturer' || norm === 'mfg' || norm === 'brand' || norm === 'vendor')) {
      mapping.manufacturer = h;
    } else if (!mapping.modelNumber && (norm === 'modelnumber' || norm === 'model' || norm === 'partnumber' || norm === 'part' || norm === 'sku' || norm === 'modelno')) {
      mapping.modelNumber = h;
    } else if (!mapping.quantity && (norm === 'quantity' || norm === 'qty' || norm === 'count')) {
      mapping.quantity = h;
    } else if (!mapping.description && (norm === 'description' || norm === 'desc' || norm === 'name' || norm === 'productname')) {
      mapping.description = h;
    } else if (!mapping.cost && (norm === 'cost' || norm === 'price' || norm === 'unitprice' || norm === 'unitcost' || norm === 'amount')) {
      mapping.cost = h;
    }
  }

  return mapping;
}
