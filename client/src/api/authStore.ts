import axios from "axios";
import type { AuthResult, User } from "./types";

const REFRESH_TOKEN_STORAGE_KEY = "gps.refreshToken";

interface AuthState {
  accessToken: string | null;
  user: User | null;
}

let state: AuthState = { accessToken: null, user: null };
let refreshToken: string | null = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
const listeners = new Set<() => void>();

export function getAuthState(): AuthState {
  return state;
}

export function subscribeAuth(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setState(next: AuthState) {
  state = next;
  listeners.forEach((cb) => cb());
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function setAuth(result: AuthResult) {
  refreshToken = result.refreshToken;
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  setState({ accessToken: result.accessToken, user: result.user });
}

export function clearAuth() {
  refreshToken = null;
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  setState({ accessToken: null, user: null });
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5115/api";

/// Bypasses the apiClient interceptors below - used only for the refresh call itself, so a failed
/// refresh can't recursively trigger another refresh attempt.
export async function trySilentRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const { data } = await axios.post<AuthResult>(`${baseURL}/auth/refresh`, { refreshToken });
    setAuth(data);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}
