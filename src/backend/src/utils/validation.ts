import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  domain: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  settings: z.record(z.unknown()).optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be admin or member' }),
  }),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ---- Project ----

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['draft', 'active', 'won', 'lost', 'completed']).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  architectName: z.string().max(200).optional(),
  generalContractor: z.string().max(200).optional(),
  orgId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedValue: z.number().min(0).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(['draft', 'active', 'won', 'lost', 'completed']).optional(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  architectName: z.string().max(200).optional().nullable(),
  generalContractor: z.string().max(200).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  estimatedValue: z.number().min(0).optional().nullable(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ---- Quote ----

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  category: z.string().max(100).optional(),
  quantity: z.number().min(0),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0),
  manufacturer: z.string().max(200).optional(),
  partNumber: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createQuoteSchema = z.object({
  validUntil: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export const updateQuoteSchema = z.object({
  validUntil: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(lineItemSchema).optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

// ---- RFQ Document ----

export const createDocumentSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  fileSize: z.number().int().min(0),
  mimeType: z.string().min(1).max(100),
  documentType: z.enum(['rfq', 'engineering_design', 'specification', 'other']).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

// ---- Change Order ----

const changeOrderLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  changeType: z.enum(['added', 'removed', 'modified']),
  originalQuantity: z.number().min(0).optional(),
  originalUnitPrice: z.number().min(0).optional(),
  newQuantity: z.number().min(0).optional(),
  newUnitPrice: z.number().min(0).optional(),
});

export const createChangeOrderSchema = z.object({
  quoteId: z.string().uuid(),
  type: z.enum(['customer', 'vendor']),
  description: z.string().min(1).max(2000),
  reason: z.string().max(2000).optional(),
  revisedAmount: z.number().min(0),
  lineItems: z.array(changeOrderLineItemSchema).optional(),
});

export const updateChangeOrderSchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  reason: z.string().max(2000).optional().nullable(),
  revisedAmount: z.number().min(0).optional(),
  lineItems: z.array(changeOrderLineItemSchema).optional(),
});

export type CreateChangeOrderInput = z.infer<typeof createChangeOrderSchema>;
export type UpdateChangeOrderInput = z.infer<typeof updateChangeOrderSchema>;

// ---- Invoice ----

const invoiceLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  quoteId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  terms: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(invoiceLineItemSchema).optional(),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional().nullable(),
  terms: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(invoiceLineItemSchema).optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().min(0.01),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

// ---- Purchase Order ----

const poLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0),
  manufacturer: z.string().max(200).optional(),
  partNumber: z.string().max(100).optional(),
});

export const createPurchaseOrderSchema = z.object({
  vendorName: z.string().min(1).max(200),
  vendorEmail: z.string().email().optional(),
  vendorAddress: z.string().max(500).optional(),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(poLineItemSchema).optional(),
});

export const updatePurchaseOrderSchema = z.object({
  vendorName: z.string().min(1).max(200).optional(),
  vendorEmail: z.string().email().optional().nullable(),
  vendorAddress: z.string().max(500).optional().nullable(),
  expectedDeliveryDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(poLineItemSchema).optional(),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

// ---- Sales Order ----

const soLineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unit: z.string().max(50).optional(),
  unitPrice: z.number().min(0),
});

export const createSalesOrderSchema = z.object({
  quoteId: z.string().uuid().optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(soLineItemSchema).optional(),
});

export const updateSalesOrderSchema = z.object({
  customerName: z.string().min(1).max(200).optional(),
  customerEmail: z.string().email().optional().nullable(),
  customerAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  tax: z.number().min(0).optional(),
  lineItems: z.array(soLineItemSchema).optional(),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.infer<typeof updateSalesOrderSchema>;
