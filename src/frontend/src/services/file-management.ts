import api from './api';
import type { ProjectFile, ProjectFolder } from '@/types/domain';

export interface FilesResponse {
  folders: ProjectFolder[];
  files: ProjectFile[];
}

export async function getFiles(
  projectId: string,
  folderId?: string | null,
): Promise<FilesResponse> {
  const params = folderId ? { folderId } : {};
  const { data } = await api.get(`/projects/${projectId}/files`, { params });
  return data;
}

export async function createFolder(
  projectId: string,
  body: { name: string; parentId?: string | null },
): Promise<ProjectFolder> {
  const { data } = await api.post(`/projects/${projectId}/files/folders`, body);
  return data;
}

export async function renameFolder(
  projectId: string,
  folderId: string,
  name: string,
): Promise<ProjectFolder> {
  const { data } = await api.patch(`/projects/${projectId}/files/folders/${folderId}`, { name });
  return data;
}

export async function deleteFolder(projectId: string, folderId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/files/folders/${folderId}`);
}

export async function uploadFile(
  projectId: string,
  file: File,
  folderId?: string | null,
): Promise<ProjectFile> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  const { data } = await api.post(`/projects/${projectId}/files/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteFile(projectId: string, fileId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/files/${fileId}`);
}

export async function moveFile(
  projectId: string,
  fileId: string,
  folderId: string | null,
): Promise<ProjectFile> {
  const { data } = await api.patch(`/projects/${projectId}/files/${fileId}/move`, { folderId });
  return data;
}
