// mobile/services/apiClient.ts
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/authStore";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  auth?: boolean; // whether to send Authorization header
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as any) : null;

  if (!response.ok) {
    const detail = data?.detail || "Unknown error from server.";
    throw new Error(detail);
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, auth: boolean = true) =>
    apiRequest<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: any, auth: boolean = true) =>
    apiRequest<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: any, auth: boolean = true) =>
    apiRequest<T>(path, { method: "PUT", body, auth }),
  patch: <T>(path: string, body?: any, auth: boolean = true) =>
    apiRequest<T>(path, { method: "PATCH", body, auth }),
  delete: <T>(path: string, auth: boolean = true) =>
    apiRequest<T>(path, { method: "DELETE", auth }),
};
