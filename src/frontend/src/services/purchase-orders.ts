import api from './api';
import type { PurchaseOrder, CreatePurchaseOrderRequest } from '@/types/domain';

export async function getPurchaseOrders(projectId: string): Promise<PurchaseOrder[]> {
  const { data } = await api.get(`/projects/${projectId}/purchase-orders`);
  return data;
}

export async function getPurchaseOrder(
  projectId: string,
  poId: string,
): Promise<PurchaseOrder> {
  const { data } = await api.get(`/projects/${projectId}/purchase-orders/${poId}`);
  return data;
}

export async function createPurchaseOrder(
  req: CreatePurchaseOrderRequest,
): Promise<PurchaseOrder> {
  const { data } = await api.post(
    `/projects/${req.projectId}/purchase-orders`,
    req,
  );
  return data;
}

export async function sendPurchaseOrder(
  projectId: string,
  poId: string,
): Promise<PurchaseOrder> {
  const { data } = await api.post(
    `/projects/${projectId}/purchase-orders/${poId}/send`,
  );
  return data;
}
