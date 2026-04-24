import api from './api';
import type { Quote, CreateQuoteRequest, UpdateQuoteRequest } from '@/types/domain';

export async function getQuotes(projectId: string): Promise<Quote[]> {
  const { data } = await api.get(`/projects/${projectId}/quotes`);
  return data;
}

export async function getQuote(projectId: string, quoteId: string): Promise<Quote> {
  const { data } = await api.get(`/projects/${projectId}/quotes/${quoteId}`);
  return data;
}

export async function createQuote(req: CreateQuoteRequest): Promise<Quote> {
  const { data } = await api.post(`/projects/${req.projectId}/quotes`, req);
  return data;
}

export async function updateQuote(
  projectId: string,
  quoteId: string,
  req: UpdateQuoteRequest,
): Promise<Quote> {
  const { data } = await api.patch(`/projects/${projectId}/quotes/${quoteId}`, req);
  return data;
}

export async function submitQuote(projectId: string, quoteId: string): Promise<Quote> {
  const { data } = await api.post(`/projects/${projectId}/quotes/${quoteId}/submit`);
  return data;
}

export async function winQuote(projectId: string, quoteId: string): Promise<Quote> {
  const { data } = await api.post(`/projects/${projectId}/quotes/${quoteId}/win`);
  return data;
}

export async function loseQuote(projectId: string, quoteId: string): Promise<Quote> {
  const { data } = await api.post(`/projects/${projectId}/quotes/${quoteId}/lose`);
  return data;
}

export async function reviseQuote(projectId: string, quoteId: string): Promise<Quote> {
  const { data } = await api.post(`/projects/${projectId}/quotes/${quoteId}/revise`);
  return data;
}
