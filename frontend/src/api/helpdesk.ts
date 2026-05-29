import client from './client';
import type { PaginatedResponse } from '@/types/common';
import type { Team, Ticket, TicketMessage } from '@/types/helpdesk';

// Teams

export async function getTeams(): Promise<Team[]> {
  const { data } = await client.get('/helpdesk/teams/');
  return data;
}

// Tickets

export async function getTickets(
  params?: Record<string, string | number>,
): Promise<PaginatedResponse<Ticket>> {
  const { data } = await client.get('/helpdesk/tickets/', { params });
  return data;
}

export async function getTicket(id: number): Promise<Ticket> {
  const { data } = await client.get(`/helpdesk/tickets/${id}/`);
  return data;
}

export async function createTicket(
  payload: Partial<Ticket>,
): Promise<Ticket> {
  const { data } = await client.post('/helpdesk/tickets/', payload);
  return data;
}

export async function updateTicket(
  id: number,
  payload: Partial<Ticket>,
): Promise<Ticket> {
  const { data } = await client.patch(
    `/helpdesk/tickets/${id}/`,
    payload,
  );
  return data;
}

export async function assignTicket(
  id: number,
  userId: number,
): Promise<Ticket> {
  const { data } = await client.post(`/helpdesk/tickets/${id}/assign/`, {
    user_id: userId,
  });
  return data;
}

export async function moveTicket(
  id: number,
  stageId: number,
): Promise<Ticket> {
  const { data } = await client.post(`/helpdesk/tickets/${id}/move/`, {
    stage_id: stageId,
  });
  return data;
}

// Messages

export async function getTicketMessages(
  ticketId: number,
): Promise<TicketMessage[]> {
  const { data } = await client.get(
    `/helpdesk/tickets/${ticketId}/messages/`,
  );
  return data;
}

export async function createTicketMessage(
  ticketId: number,
  payload: { body: string; message_type?: string },
): Promise<TicketMessage> {
  const { data } = await client.post(
    `/helpdesk/tickets/${ticketId}/messages/`,
    payload,
  );
  return data;
}
