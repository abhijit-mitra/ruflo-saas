import api from './api';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  User,
} from '@/types';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await api.post<{ data: AuthResponse }>('/auth/login', data);
  return response.data.data;
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  const response = await api.post<{ data: AuthResponse }>('/auth/signup', data);
  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>('/auth/forgot-password', data);
  return response.data;
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  const response = await api.post<{ message: string }>('/auth/reset-password', data);
  return response.data;
}

export async function refreshToken(): Promise<{ accessToken: string; user: User }> {
  const response = await api.post<{ accessToken: string; user: User }>(
    '/auth/refresh',
    {},
    { withCredentials: true },
  );
  return response.data;
}

export function getGoogleAuthUrl(): string {
  return '/api/auth/google';
}

export function getMicrosoftAuthUrl(): string {
  return '/api/auth/microsoft';
}
