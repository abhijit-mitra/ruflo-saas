import api from './api';
import type { ChangeOrder, CreateChangeOrderRequest } from '@/types/domain';

export async function getChangeOrders(projectId: string): Promise<ChangeOrder[]> {
  const { data } = await api.get(`/projects/${projectId}/change-orders`);
  return data;
}

export async function getChangeOrder(
  projectId: string,
  coId: string,
): Promise<ChangeOrder> {
  const { data } = await api.get(`/projects/${projectId}/change-orders/${coId}`);
  return data;
}

export async function createChangeOrder(
  req: CreateChangeOrderRequest,
): Promise<ChangeOrder> {
  const { data } = await api.post(
    `/projects/${req.projectId}/change-orders`,
    req,
  );
  return data;
}

export async function approveChangeOrder(
  projectId: string,
  coId: string,
): Promise<ChangeOrder> {
  const { data } = await api.post(
    `/projects/${projectId}/change-orders/${coId}/approve`,
  );
  return data;
}

export async function rejectChangeOrder(
  projectId: string,
  coId: string,
): Promise<ChangeOrder> {
  const { data } = await api.post(
    `/projects/${projectId}/change-orders/${coId}/reject`,
  );
  return data;
}
