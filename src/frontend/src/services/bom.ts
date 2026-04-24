import api from './api';
import type { BillOfMaterials, BOMProduct, CreateBOMRequest } from '@/types/domain';

export async function getBOMs(projectId: string): Promise<BillOfMaterials[]> {
  const { data } = await api.get(`/projects/${projectId}/boms`);
  return data;
}

export async function getBOM(projectId: string, bomId: string): Promise<BillOfMaterials & { products: BOMProduct[] }> {
  const { data } = await api.get(`/projects/${projectId}/boms/${bomId}`);
  return data;
}

export async function createBOM(projectId: string, req: CreateBOMRequest): Promise<BillOfMaterials> {
  const { data } = await api.post(`/projects/${projectId}/boms`, req);
  return data;
}

export async function updateBOM(
  projectId: string,
  bomId: string,
  req: Partial<CreateBOMRequest> & { status?: string },
): Promise<BillOfMaterials> {
  const { data } = await api.patch(`/projects/${projectId}/boms/${bomId}`, req);
  return data;
}

export async function deleteBOM(projectId: string, bomId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/boms/${bomId}`);
}

export async function addProduct(
  projectId: string,
  bomId: string,
  product: Omit<BOMProduct, 'id' | 'bomId'>,
): Promise<BOMProduct> {
  const { data } = await api.post(`/projects/${projectId}/boms/${bomId}/products`, product);
  return data;
}

export async function updateProduct(
  projectId: string,
  bomId: string,
  productId: string,
  product: Partial<Omit<BOMProduct, 'id' | 'bomId'>>,
): Promise<BOMProduct> {
  const { data } = await api.patch(
    `/projects/${projectId}/boms/${bomId}/products/${productId}`,
    product,
  );
  return data;
}

export async function deleteProduct(
  projectId: string,
  bomId: string,
  productId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/boms/${bomId}/products/${productId}`);
}

export async function importFile(
  projectId: string,
  bomId: string,
  file: File,
): Promise<BOMProduct[]> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post(`/projects/${projectId}/boms/${bomId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
