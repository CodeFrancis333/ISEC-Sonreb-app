// mobile/services/authService.ts
import { apiRequest } from "./apiClient";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // Expected Django endpoint: /api/auth/login/
  return apiRequest<AuthResponse>("/auth/login/", {
    method: "POST",
    body: payload,
  });
}

export async function register(
  payload: RegisterPayload
): Promise<AuthResponse> {
  // Expected Django endpoint: /api/auth/register/
  return apiRequest<AuthResponse>("/auth/register/", {
    method: "POST",
    body: payload,
  });
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
  // Expected Django endpoint: /api/auth/me/
  return apiRequest<AuthUser>("/auth/me/", {
    method: "GET",
    token,
  });
}
