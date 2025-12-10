// mobile/services/authService.ts
import { apiClient } from "./apiClient";
import { AuthResult } from "../types/auth";

export type RegisterResponse = {
  detail: string;
  uid?: string;
  code?: string;
};

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  // /auth/login/ -> http://IP:8000/api/auth/login/
  const data = await apiClient.post<AuthResult>(
    "/auth/login/",
    { email, password },
    false, // auth = false (no Authorization header for login)
  );
  return data;
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const data = await apiClient.post<RegisterResponse>(
    "/auth/register/",
    { name, email, password },
    false,
  );
  return data;
}

// optional, in case you later want /auth/me/
export async function me() {
  const data = await apiClient.get("/auth/me/");
  return data;
}

export type ForgotPasswordResponse = {
  detail: string;
  uid?: string;
  token?: string;
};

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot/",
    { email },
    false
  );
}

export async function resetPassword(
  uid: string,
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ detail: string }> {
  return apiClient.post(
    "/auth/reset/",
    {
      uid,
      token,
      new_password: newPassword,
      confirm_password: confirmPassword,
    },
    false
  );
}

export type VerifyResponse = {
  detail: string;
  uid?: string;
  code?: string;
  user?: any;
  token?: string;
};

export async function sendVerification(email: string): Promise<VerifyResponse> {
  return apiClient.post<VerifyResponse>(
    "/auth/verify/send/",
    { email },
    false
  );
}

export async function confirmVerification(
  uid: string,
  code: string
): Promise<VerifyResponse> {
  return apiClient.post<VerifyResponse>(
    "/auth/verify/confirm/",
    { uid, code },
    false
  );
}
