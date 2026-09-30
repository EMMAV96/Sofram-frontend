import { apiRequest } from './apiClient';
import type { Role } from '../auth/roles';

export type LoginRequest = {
  username: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  username: string;
  rol: Role;
};

export type CurrentUserResponse = {
  id: number;
  username: string;
  rol: Role;
  empleadoId: number;
};

export function login(request: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: request,
    skipUnauthorizedHandler: true,
  });
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return apiRequest<CurrentUserResponse>('/auth/me');
}
