// mobile/services/authService.ts
import { apiClient } from "./apiClient";
import { AuthResult } from "../types/auth";

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
): Promise<AuthResult> {
  const data = await apiClient.post<AuthResult>(
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
