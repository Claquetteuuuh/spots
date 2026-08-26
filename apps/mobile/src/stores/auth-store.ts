import { create } from "zustand";
import axios from "axios";
import * as api from "../lib/api";
import { clearTokens, hasStoredSession } from "../lib/auth";
import type { User } from "../types";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

interface RegisterParams {
  email: string;
  password: string;
  username: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  // Starts true: the root navigator waits on this before deciding
  // whether to show the auth stack or the main tabs.
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.login({ email, password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to sign in") });
      throw err;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.loginWithGoogle(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to sign in with Google") });
      throw err;
    }
  },

  register: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await api.register(params);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: extractErrorMessage(err, "Unable to create account") });
      throw err;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const hasSession = await hasStoredSession();
      if (!hasSession) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      await clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),

  clearError: () => set({ error: null }),
}));
