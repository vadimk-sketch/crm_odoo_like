import client from './client';
import type { PaginatedResponse } from '@/types/common';
import type { Pipeline, Deal } from '@/types/crm';

// Pipelines

export async function getPipelines(): Promise<Pipeline[]> {
  const { data } = await client.get('/crm/pipelines/');
  return Array.isArray(data) ? data : (data.results ?? []);
}

export async function getPipeline(id: number): Promise<Pipeline> {
  const { data } = await client.get(`/crm/pipelines/${id}/`);
  return data;
}

// Deals

export async function getDeals(
  params?: Record<string, string | number>,
): Promise<PaginatedResponse<Deal>> {
  const { data } = await client.get('/crm/deals/', { params });
  return data;
}

export async function getDeal(id: number): Promise<Deal> {
  const { data } = await client.get(`/crm/deals/${id}/`);
  return data;
}

export async function createDeal(payload: Partial<Deal>): Promise<Deal> {
  const { data } = await client.post('/crm/deals/', payload);
  return data;
}

export async function updateDeal(
  id: number,
  payload: Partial<Deal>,
): Promise<Deal> {
  const { data } = await client.patch(`/crm/deals/${id}/`, payload);
  return data;
}

export async function deleteDeal(id: number): Promise<void> {
  await client.delete(`/crm/deals/${id}/`);
}

export async function moveDeal(
  id: number,
  stageId: number,
): Promise<Deal> {
  const { data } = await client.post(`/crm/deals/${id}/move/`, {
    stage_id: stageId,
  });
  return data;
}

interface DealSummary {
  total_deals: number;
  total_value: number;
  won_value: number;
  lost_value: number;
  avg_deal_value: number;
  conversion_rate: number;
}

export async function getDealSummary(
  params?: Record<string, string | number>,
): Promise<DealSummary> {
  const { data } = await client.get('/crm/deals/summary/', { params });
  return data;
}
