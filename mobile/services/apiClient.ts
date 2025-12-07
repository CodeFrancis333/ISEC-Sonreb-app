// mobile/services/apiClient.ts
import { API_BASE_URL } from "../constants";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message: (data && (data.detail || data.message)) || res.statusText,
      details: data,
    };
    throw err;
  }

  return data as T;
}

/**
 * Generic API request helper.
 * `path` is relative to API_BASE_URL (e.g. "/auth/login/").
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {} } = options;

  const url = `${API_BASE_URL}${path}`;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  let finalBody: BodyInit | undefined;

  if (body !== undefined && body !== null) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: finalBody,
  });

  return handleResponse<T>(res);
}
