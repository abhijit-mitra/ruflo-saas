import api from './api';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/domain';

export async function getProjects(params?: {
  status?: string;
  search?: string;
}): Promise<Project[]> {
  const { data } = await api.get('/projects', { params });
  return data.data ?? data;
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await api.get(`/projects/${id}`);
  return data.data ?? data;
}

export async function createProject(req: CreateProjectRequest): Promise<Project> {
  const { data } = await api.post('/projects', req);
  return data.data ?? data;
}

export async function updateProject(
  id: string,
  req: UpdateProjectRequest,
): Promise<Project> {
  const { data } = await api.patch(`/projects/${id}`, req);
  return data.data ?? data;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
