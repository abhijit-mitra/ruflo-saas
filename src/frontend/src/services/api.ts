import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

function getAccessToken(): string | null {
  try {
    const stored = sessionStorage.getItem('ruflo-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

function setAccessToken(token: string): void {
  try {
    const stored = sessionStorage.getItem('ruflo-auth');
    if (!stored) return;
    const parsed = JSON.parse(stored);
    parsed.state.accessToken = token;
    sessionStorage.setItem('ruflo-auth', JSON.stringify(parsed));
  } catch {
    // Silently fail
  }
}

function clearAuthStorage(): void {
  sessionStorage.removeItem('ruflo-auth');
}

// Request interceptor: attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Skip refresh for auth endpoints
    const url = originalRequest.url ?? '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      const response = await axios.post('/api/auth/refresh', {}, {
        withCredentials: true,
      });
      const { accessToken } = response.data;
      setAccessToken(accessToken);
      processQueue(null, accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuthStorage();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
