import api from './api';
import type { SalesOrder, CreateSalesOrderRequest } from '@/types/domain';

export async function getSalesOrders(projectId: string): Promise<SalesOrder[]> {
  const { data } = await api.get(`/projects/${projectId}/sales-orders`);
  return data;
}

export async function getSalesOrder(
  projectId: string,
  soId: string,
): Promise<SalesOrder> {
  const { data } = await api.get(`/projects/${projectId}/sales-orders/${soId}`);
  return data;
}

export async function createSalesOrder(
  req: CreateSalesOrderRequest,
): Promise<SalesOrder> {
  const { data } = await api.post(
    `/projects/${req.projectId}/sales-orders`,
    req,
  );
  return data;
}

export async function confirmSalesOrder(
  projectId: string,
  soId: string,
): Promise<SalesOrder> {
  const { data } = await api.post(
    `/projects/${projectId}/sales-orders/${soId}/confirm`,
  );
  return data;
}
