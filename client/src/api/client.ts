import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAuthState, getRefreshToken, trySilentRefresh } from "./authStore";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5115/api",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = getAuthState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

// Multiple requests can 401 at once (e.g. a page firing several queries); coalesce them onto a
// single in-flight refresh instead of racing several refresh calls against the same rotating token.
let refreshPromise: Promise<boolean> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status === 401 && original && !original._retried && getRefreshToken()) {
      original._retried = true;
      refreshPromise ??= trySilentRefresh().finally(() => {
        refreshPromise = null;
      });

      if (await refreshPromise) {
        original.headers.Authorization = `Bearer ${getAuthState().accessToken}`;
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  }
);
