import client from './client';
import type { PaginatedResponse } from '@/types/common';
import type { Contact, Company, Tag } from '@/types/contact';

// Contacts

export async function getContacts(
  params?: Record<string, string | number>,
): Promise<PaginatedResponse<Contact>> {
  const { data } = await client.get('/contacts/contacts/', { params });
  return data;
}

export async function getContact(id: number): Promise<Contact> {
  const { data } = await client.get(`/contacts/contacts/${id}/`);
  return data;
}

export async function createContact(
  payload: Partial<Contact>,
): Promise<Contact> {
  const { data } = await client.post('/contacts/contacts/', payload);
  return data;
}

export async function updateContact(
  id: number,
  payload: Partial<Contact>,
): Promise<Contact> {
  const { data } = await client.patch(`/contacts/contacts/${id}/`, payload);
  return data;
}

export async function deleteContact(id: number): Promise<void> {
  await client.delete(`/contacts/contacts/${id}/`);
}

// Companies

export async function getCompanies(
  params?: Record<string, string | number>,
): Promise<PaginatedResponse<Company>> {
  const { data } = await client.get('/contacts/companies/', { params });
  return data;
}

export async function getCompany(id: number): Promise<Company> {
  const { data } = await client.get(`/contacts/companies/${id}/`);
  return data;
}

export async function createCompany(
  payload: Partial<Company>,
): Promise<Company> {
  const { data } = await client.post('/contacts/companies/', payload);
  return data;
}

export async function updateCompany(
  id: number,
  payload: Partial<Company>,
): Promise<Company> {
  const { data } = await client.patch(
    `/contacts/companies/${id}/`,
    payload,
  );
  return data;
}

export async function deleteCompany(id: number): Promise<void> {
  await client.delete(`/contacts/companies/${id}/`);
}

// Tags

export async function getTags(): Promise<Tag[]> {
  const { data } = await client.get('/contacts/tags/');
  return data;
}

export async function createTag(
  payload: Pick<Tag, 'name' | 'color'>,
): Promise<Tag> {
  const { data } = await client.post('/contacts/tags/', payload);
  return data;
}
