// mobile/services/apiClient.ts
import { API_BASE_URL } from "../constants";
import { useAuthStore } from "../store/authStore";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
    method?: HttpMethod;
    body?: any; // Used for POST, PUT, PATCH
    params?: Record<string, string | number | boolean>; // Used for GET/query params
    auth?: boolean; // Whether to send Authorization header
}

/**
 * Core function to handle all API requests.
 */
async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, params, auth = true } = options;
    const token = useAuthStore.getState().token;
    
    // 1. Build the URL
    let url = `${API_BASE_URL}${path}`;

    // Append URL parameters only for GET requests
    if (params && method === 'GET') {
        const searchParams = new URLSearchParams(params as Record<string, string>).toString();
        url += `?${searchParams}`;
    }

    // 2. Determine Headers and Body
    const headers: Record<string, string> = {};
    const isBodyMethod = method === "POST" || method === "PUT" || method === "PATCH";
    
    // Only send Content-Type for methods that have a body
    if (isBodyMethod) {
        headers["Content-Type"] = "application/json";
    }

    // Include Auth header if requested and token exists
    if (auth && token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Only set body for methods that use it
    const finalBody = isBodyMethod && body ? JSON.stringify(body) : undefined;
    
    console.log(`API request (${method}) to:`, url);

    // 3. Execute Fetch Request
    const response = await fetch(url, {
        method,
        headers,
        body: finalBody,
    });

    // 4. Handle Response and Errors
    // Always read text first to check for non-JSON errors
    const text = await response.text();
    let data: any = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (e) {
            // Response was not JSON (likely an HTML/plain text error page)
            data = null;
        }
    }

    if (!response.ok) {
        // Construct a helpful error message
        const detail =
            data?.detail ||
            data?.error ||
            text || // fall back to raw text if error is non-JSON
            `HTTP ${response.status} Error`;

        throw new Error(detail);
    }

    return data as T;
}

/**
 * Public API Client interface for easy method calling.
 */
export const apiClient = {
    get: <T>(path: string, params?: RequestOptions['params'], auth: boolean = true) =>
        apiRequest<T>(path, { method: "GET", params, auth }),
        
    post: <T>(path: string, body?: any, auth: boolean = true) =>
        apiRequest<T>(path, { method: "POST", body, auth }),
        
    put: <T>(path: string, body?: any, auth: boolean = true) =>
        apiRequest<T>(path, { method: "PUT", body, auth }),
        
    patch: <T>(path: string, body?: any, auth: boolean = true) =>
        apiRequest<T>(path, { method: "PATCH", body, auth }),
        
    delete: <T>(path: string, auth: boolean = true) =>
        apiRequest<T>(path, { method: "DELETE", auth }),
};