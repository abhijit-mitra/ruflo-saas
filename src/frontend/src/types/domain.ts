// Tenant types
export type TenantType = 'sales_rep' | 'distributor' | 'contractor';

// Status enums
export type ProjectStatus = 'draft' | 'active' | 'won' | 'lost' | 'completed';
export type QuoteStatus = 'draft' | 'submitted' | 'won' | 'lost' | 'revised';
export type InvoiceStatus = 'draft' | 'sent' | 'paid';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'acknowledged' | 'received';
export type SalesOrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered';
export type ChangeOrderType = 'customer' | 'vendor';
export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected';
export type DocumentType = 'rfq' | 'engineering_design' | 'specification' | 'other';

// Line item (shared across quotes, invoices, POs, SOs)
export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  manufacturer?: string;
  partNumber?: string;
  total: number;
}

// Project
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  address?: string;
  description?: string;
  estimatedValue: number;
  quoteCount: number;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CreateProjectRequest {
  name: string;
  address?: string;
  description?: string;
  estimatedValue?: number;
  customerName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: ProjectStatus;
}

// Quote
export interface Quote {
  id: string;
  projectId: string;
  version: number;
  status: QuoteStatus;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteRequest {
  projectId: string;
  lineItems: Omit<LineItem, 'id' | 'total'>[];
  taxRate?: number;
  discountRate?: number;
  notes?: string;
}

export interface UpdateQuoteRequest {
  lineItems?: Omit<LineItem, 'id' | 'total'>[];
  taxRate?: number;
  discountRate?: number;
  notes?: string;
}

// RFQ Document
export interface RFQDocument {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  size: number;
  url: string;
  uploadedAt: string;
}

// Change Order
export interface ChangeOrderItem {
  id: string;
  description: string;
  changeType: 'added' | 'removed' | 'modified';
  originalQuantity?: number;
  newQuantity?: number;
  originalUnitPrice?: number;
  newUnitPrice?: number;
  originalTotal?: number;
  newTotal?: number;
}

export interface ChangeOrder {
  id: string;
  projectId: string;
  quoteId: string;
  type: ChangeOrderType;
  status: ChangeOrderStatus;
  items: ChangeOrderItem[];
  originalAmount: number;
  revisedAmount: number;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChangeOrderRequest {
  projectId: string;
  quoteId: string;
  type: ChangeOrderType;
  items: Omit<ChangeOrderItem, 'id'>[];
  reason?: string;
}

// Invoice
export interface Invoice {
  id: string;
  projectId: string;
  quoteId?: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  projectId: string;
  quoteId?: string;
  lineItems: Omit<LineItem, 'id' | 'total'>[];
  taxRate?: number;
  discountRate?: number;
  dueDate: string;
  notes?: string;
}

// Purchase Order
export interface PurchaseOrder {
  id: string;
  projectId: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  expectedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseOrderRequest {
  projectId: string;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  lineItems: Omit<LineItem, 'id' | 'total'>[];
  taxRate?: number;
  expectedDelivery?: string;
  notes?: string;
}

// Sales Order
export interface SalesOrder {
  id: string;
  projectId: string;
  quoteId?: string;
  soNumber: string;
  status: SalesOrderStatus;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderRequest {
  projectId: string;
  quoteId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  lineItems: Omit<LineItem, 'id' | 'total'>[];
  taxRate?: number;
  notes?: string;
}
