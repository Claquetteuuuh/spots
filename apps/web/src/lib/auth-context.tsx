"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { apiClient, getToken, getRefreshToken } from "./api-client";
import type { User } from "./api-client";
import type { RegisterInput } from "@trs/shared/validation";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token && !getRefreshToken()) {
        setIsLoading(false);
        return;
      }

      try {
        // Try the current access token first
        const u = await apiClient.auth.me();
        setUser(u);
      } catch {
        // Access token expired — auto-refresh handles the retry
        // If that also failed, clear everything
        if (!getToken()) {
          apiClient.auth.logout();
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.auth.login(email, password);
    setUser(res.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await apiClient.auth.register(input);
    setUser(res.user);
  }, []);

  const loginWithGoogle = useCallback(async (token: string) => {
    const res = await apiClient.auth.loginWithGoogle(token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    apiClient.auth.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updated = await apiClient.auth.me();
      setUser(updated);
    } catch {
      // If refresh fails, keep current user
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      loginWithGoogle,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, loginWithGoogle, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
