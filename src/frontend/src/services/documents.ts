import api from './api';
import type { RFQDocument } from '@/types/domain';

export async function getDocuments(projectId: string): Promise<RFQDocument[]> {
  const { data } = await api.get(`/projects/${projectId}/documents`);
  return data;
}

export async function uploadDocument(
  projectId: string,
  file: File,
  type: string,
): Promise<RFQDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  const { data } = await api.post(`/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteDocument(
  projectId: string,
  documentId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/documents/${documentId}`);
}
