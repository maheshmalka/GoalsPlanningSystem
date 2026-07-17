import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { authApi } from "../api/authApi";
import { clearAuth, getAuthState, getRefreshToken, setAuth, subscribeAuth, trySilentRefresh } from "../api/authStore";
import type { AuthResult, User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (result: AuthResult) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribeAuth, getAuthState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trySilentRefresh().finally(() => setIsLoading(false));
  }, []);

  const signIn = (result: AuthResult) => setAuth(result);

  const signOut = () => {
    const token = getRefreshToken();
    clearAuth();
    if (token) authApi.logout(token).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user: state.user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
