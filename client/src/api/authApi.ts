import axios from "axios";
import type { AuthResult } from "./types";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5115/api";

// A separate, un-intercepted axios instance: these calls happen before we have an access token (or
// are the refresh call itself), so they must never go through apiClient's auth-header/401-retry logic.
const authClient = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });

export const authApi = {
  register: (dto: { email: string; password: string; displayName: string }) =>
    authClient.post<AuthResult>("/auth/register", dto).then((r) => r.data),

  login: (dto: { email: string; password: string }) =>
    authClient.post<AuthResult>("/auth/login", dto).then((r) => r.data),

  google: (idToken: string) =>
    authClient.post<AuthResult>("/auth/google", { idToken }).then((r) => r.data),

  microsoft: (accessToken: string) =>
    authClient.post<AuthResult>("/auth/microsoft", { accessToken }).then((r) => r.data),

  logout: (refreshToken: string) =>
    authClient.post("/auth/logout", { refreshToken }),
};
