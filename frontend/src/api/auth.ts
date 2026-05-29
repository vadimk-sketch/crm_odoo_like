import client from './client';
import type { User } from '@/types/auth';

interface TokenResponse {
  access: string;
  refresh: string;
}

export async function login(
  email: string,
  password: string,
): Promise<User> {
  const { data } = await client.post<TokenResponse>('/auth/login/', {
    email,
    password,
  });
  localStorage.setItem('access_token', data.access);
  localStorage.setItem('refresh_token', data.refresh);
  return getMe();
}

export async function register(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<User> {
  const { data } = await client.post<User>('/auth/register/', payload);
  return data;
}

export async function refreshToken(): Promise<string> {
  const refresh = localStorage.getItem('refresh_token');
  const { data } = await client.post<TokenResponse>('/auth/refresh/', {
    refresh,
  });
  localStorage.setItem('access_token', data.access);
  if (data.refresh) {
    localStorage.setItem('refresh_token', data.refresh);
  }
  return data.access;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/auth/me/');
  return data;
}

export function logout(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
