import api from './api';
import type { Invoice, CreateInvoiceRequest } from '@/types/domain';

export async function getInvoices(projectId: string): Promise<Invoice[]> {
  const { data } = await api.get(`/projects/${projectId}/invoices`);
  return data;
}

export async function getInvoice(
  projectId: string,
  invoiceId: string,
): Promise<Invoice> {
  const { data } = await api.get(`/projects/${projectId}/invoices/${invoiceId}`);
  return data;
}

export async function createInvoice(req: CreateInvoiceRequest): Promise<Invoice> {
  const { data } = await api.post(`/projects/${req.projectId}/invoices`, req);
  return data;
}

export async function sendInvoice(
  projectId: string,
  invoiceId: string,
): Promise<Invoice> {
  const { data } = await api.post(
    `/projects/${projectId}/invoices/${invoiceId}/send`,
  );
  return data;
}

export async function recordPayment(
  projectId: string,
  invoiceId: string,
  amount: number,
): Promise<Invoice> {
  const { data } = await api.post(
    `/projects/${projectId}/invoices/${invoiceId}/pay`,
    { amount },
  );
  return data;
}
