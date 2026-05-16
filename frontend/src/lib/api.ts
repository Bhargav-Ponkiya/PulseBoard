import { useAuthStore } from '@/store/auth.store';
import { API_BASE_URL as BASE_URL } from './config';
const REQUEST_TIMEOUT_MS = 60000;

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshPromise: Promise<{ accessToken: string; user?: { id: string; email: string; name: string } }> | null = null;

async function doRefresh(): Promise<{ accessToken: string; user?: { id: string; email: string; name: string } }> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).then(async (refreshRes) => {
      if (!refreshRes.ok) {
        refreshPromise = null;
        throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.');
      }
      const body = await refreshRes.json() as ApiResponse<{ accessToken: string; user?: { id: string; email: string; name: string } }>;
      if (!body.success) {
        refreshPromise = null;
        throw new ApiError(401, body.error.code, body.error.message);
      }
      return body.data;
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let body: ApiResponse<T>;

  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, 'PARSE_ERROR', 'Invalid JSON response');
  }

  if (!body.success) {
    throw new ApiError(
      res.status,
      body.error.code,
      body.error.message,
      body.error.details,
    );
  }

  return body.data;
}

export async function apiCall<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const { accessToken, clearAuth } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const useTimeout = !options?.signal;
  const abortController = useTimeout ? new AbortController() : null;
  const timeoutId = useTimeout ? setTimeout(() => abortController!.abort(), REQUEST_TIMEOUT_MS) : null;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: options?.signal ?? abortController!.signal,
    });
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    
    if (err instanceof DOMException && err.name === 'AbortError') {
      // If we used our internal timeout and that's what triggered the abort
      if (useTimeout && abortController?.signal.aborted) {
        throw new ApiError(408, 'REQUEST_TIMEOUT', 'Request timed out. Please try again.');
      }
      // If it was an external abort (manual cancellation), rethrow as DOMException
      throw err;
    }
    throw err;
  }

  if (timeoutId) clearTimeout(timeoutId);

  if (res.status === 401) {
    try {
      const refreshData = await doRefresh();

      const existingUser = useAuthStore.getState().user;
      const userToSet = refreshData.user ?? existingUser;
      if (!userToSet) {
        clearAuth();
        throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.');
      }
      useAuthStore.getState().setAuth(userToSet, refreshData.accessToken);

      headers['Authorization'] = `Bearer ${refreshData.accessToken}`;

      const retryAc = new AbortController();
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        method: options?.method ?? 'GET',
        headers,
        credentials: 'include',
        body: options?.body,
        signal: retryAc.signal,
      });

      return parseResponse<T>(retryRes);
    } catch {
      clearAuth();
      throw new ApiError(401, 'SESSION_EXPIRED', 'Session expired. Please log in again.');
    }
  }

  return parseResponse<T>(res);
}
