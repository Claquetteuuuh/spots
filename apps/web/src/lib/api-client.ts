import { API_ROUTES } from "@trs/shared/constants";
import type {
  RegisterInput,
  LoginInput,
  CreateSpotInput,
  UpdateSpotInput,
  SpotQuery,
} from "@trs/shared/validation";

// ─── Token helpers ──────────────────────────────────────────────────

const TOKEN_COOKIE = "trs_token";
const REFRESH_COOKIE = "trs_refresh_token";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function setToken(token: string): void {
  setCookie(TOKEN_COOKIE, token, 60 * 60 * 24 * 30);
}

export function clearToken(): void {
  clearCookie(TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return getCookie(REFRESH_COOKIE);
}

export function setRefreshToken(token: string): void {
  setCookie(REFRESH_COOKIE, token, 60 * 60 * 24 * 30);
}

export function clearRefreshToken(): void {
  clearCookie(REFRESH_COOKIE);
}

// ─── Base fetch helper ──────────────────────────────────────────────

interface ApiSuccess<T> {
  data: T;
  error?: never;
}

interface ApiError {
  data?: never;
  error: string;
  details?: unknown;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

/** Guard against concurrent refresh attempts. */
let refreshPromise: Promise<AuthResponse> | null = null;

async function doRefresh(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const res = await fetch(API_ROUTES.auth.refresh, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = (await res.json()) as ApiResponse<AuthResponse>;

  if (!res.ok || json.error) {
    clearToken();
    clearRefreshToken();
    throw new Error(json.error ?? "Refresh failed");
  }

  const data = json.data as AuthResponse;
  setToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  return data;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _skipRefresh = false,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  // Auto-refresh on 401 — retry once with a fresh access token
  if (res.status === 401 && !_skipRefresh && getRefreshToken()) {
    try {
      if (!refreshPromise) {
        refreshPromise = doRefresh();
      }
      await refreshPromise;
      refreshPromise = null;
      return request<T>(path, options, true);
    } catch {
      refreshPromise = null;
      // Fall through to the normal error path
    }
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || json.error) {
    // Extract field-level validation details from Zod flatten output
    const details = (json as ApiError).details as
      | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
      | undefined;
    if (details?.fieldErrors) {
      const messages = Object.entries(details.fieldErrors)
        .filter(([, msgs]) => msgs && msgs.length > 0)
        .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`);
      if (messages.length > 0) {
        throw new Error(messages.join("\n"));
      }
    }
    if (details?.formErrors && details.formErrors.length > 0) {
      throw new Error(details.formErrors.join("\n"));
    }
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }

  return json.data as T;
}

// ─── Auth types ─────────────────────────────────────────────────────

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  locale: string;
  provider: string;
  isPrivate?: boolean;
  createdAt: string;
  _count?: {
    spots: number;
    followers: number;
    following: number;
  };
}

export interface FollowRequest {
  id: string;
  follower: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

export interface SpotImage {
  id: string;
  photoUrl: string;
  photoKey: string;
  order: number;
}

export interface Spot {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  address: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string;
  title: string | null;
  description: string | null;
  isFree: boolean;
  priceInfo: string | null;
  visibility: "PRIVATE" | "FOLLOWERS";
  customComposition: string | null;
  colors: string[];
  compositions: string[];
  tags: string[];
  images?: SpotImage[];
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface SpotPhoto {
  id: string;
  spotId: string;
  userId: string;
  photoUrl: string;
  photoKey: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface ForwardGeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string | null;
  country: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}

// ─── API Client ─────────────────────────────────────────────────────

export const apiClient = {
  auth: {
    async register(input: RegisterInput): Promise<AuthResponse> {
      const res = await request<AuthResponse>(API_ROUTES.auth.register, {
        method: "POST",
        body: JSON.stringify(input),
      });
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      return res;
    },

    async login(
      email: string,
      password: string,
    ): Promise<AuthResponse> {
      const res = await request<AuthResponse>(API_ROUTES.auth.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      return res;
    },

    async loginWithGoogle(token: string): Promise<AuthResponse> {
      const res = await request<AuthResponse>(API_ROUTES.auth.google, {
        method: "POST",
        body: JSON.stringify({ token, provider: "GOOGLE" }),
      });
      setToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      return res;
    },

    async forgotPassword(email: string): Promise<void> {
      await request<{ sent: boolean }>(API_ROUTES.auth.forgotPassword, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token: string, password: string): Promise<void> {
      await request<{ reset: boolean }>(API_ROUTES.auth.resetPassword, {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
      await request<{ changed: boolean }>(API_ROUTES.auth.changePassword, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },

    async me(): Promise<User> {
      return request<User>(API_ROUTES.auth.me);
    },

    logout(): void {
      clearToken();
      clearRefreshToken();
    },

    async refresh(): Promise<AuthResponse> {
      const res = await doRefresh();
      return res;
    },
  },

  spots: {
    async list(
      query?: Partial<SpotQuery>,
    ): Promise<PaginatedResponse<Spot>> {
      const params = new URLSearchParams();
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined) params.set(k, String(v));
        }
      }
      const qs = params.toString();
      return request<PaginatedResponse<Spot>>(
        `${API_ROUTES.spots.list}${qs ? `?${qs}` : ""}`,
      );
    },

    async create(data: Partial<CreateSpotInput> & { latitude: number; longitude: number; photoUrl: string; photoKey: string; photos?: { url: string; key: string }[]; compositions?: CreateSpotInput["compositions"]; colors?: string[]; tags?: string[] }): Promise<Spot> {
      return request<Spot>(API_ROUTES.spots.create, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async get(id: string): Promise<Spot> {
      return request<Spot>(API_ROUTES.spots.detail(id));
    },

    async update(id: string, data: UpdateSpotInput): Promise<Spot> {
      return request<Spot>(API_ROUTES.spots.detail(id), {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<void> {
      await request<void>(API_ROUTES.spots.detail(id), {
        method: "DELETE",
      });
    },

    // Community photos
    async listPhotos(
      spotId: string,
      cursor?: string,
    ): Promise<PaginatedResponse<SpotPhoto>> {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const qs = params.toString();
      return request<PaginatedResponse<SpotPhoto>>(
        `${API_ROUTES.spots.photos(spotId)}${qs ? `?${qs}` : ""}`,
      );
    },

    async uploadPhoto(
      spotId: string,
      file: File,
      caption?: string,
    ): Promise<SpotPhoto> {
      const formData = new FormData();
      formData.append("photo", file);
      if (caption) formData.append("caption", caption);
      return request<SpotPhoto>(API_ROUTES.spots.photos(spotId), {
        method: "POST",
        body: formData,
      });
    },

    async feed(
      query?: Partial<SpotQuery>,
    ): Promise<PaginatedResponse<Spot>> {
      const params = new URLSearchParams();
      if (query) {
        for (const [k, v] of Object.entries(query)) {
          if (v !== undefined) params.set(k, String(v));
        }
      }
      const qs = params.toString();
      return request<PaginatedResponse<Spot>>(
        `${API_ROUTES.spots.feed}${qs ? `?${qs}` : ""}`,
      );
    },
  },

  users: {
    async profile(username: string): Promise<User> {
      return request<User>(API_ROUTES.users.profile(username));
    },

    async follow(username: string): Promise<void> {
      await request<void>(API_ROUTES.users.follow(username), {
        method: "POST",
      });
    },

    async unfollow(username: string): Promise<void> {
      await request<void>(API_ROUTES.users.unfollow(username), {
        method: "DELETE",
      });
    },

    async search(q: string): Promise<User[]> {
      const params = new URLSearchParams({ q });
      return request<User[]>(
        `${API_ROUTES.users.search}?${params.toString()}`,
      );
    },

    async followers(username: string): Promise<User[]> {
      return request<User[]>(API_ROUTES.users.followers(username));
    },

    async following(username: string): Promise<User[]> {
      return request<User[]>(API_ROUTES.users.following(username));
    },
  },

  followRequests: {
    async list(): Promise<FollowRequest[]> {
      return request<FollowRequest[]>(API_ROUTES.followRequests.list);
    },

    async count(): Promise<number> {
      const res = await request<{ count: number }>(API_ROUTES.followRequests.count);
      return res.count;
    },

    async accept(id: string): Promise<void> {
      await request<void>(API_ROUTES.followRequests.accept(id), {
        method: "POST",
      });
    },

    async reject(id: string): Promise<void> {
      await request<void>(API_ROUTES.followRequests.reject(id), {
        method: "POST",
      });
    },
  },

  upload: {
    async photo(file: File): Promise<{ url: string; key: string }> {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await request<{ photoUrl: string; photoKey: string }>(
        API_ROUTES.upload.photo,
        {
          method: "POST",
          body: formData,
        },
      );
      return { url: res.photoUrl, key: res.photoKey };
    },

    async avatar(file: File): Promise<{ url: string; key: string }> {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await request<{ photoUrl: string; photoKey: string }>(
        API_ROUTES.upload.avatar,
        {
          method: "POST",
          body: formData,
        },
      );
      return { url: res.photoUrl, key: res.photoKey };
    },
  },

  geocoding: {
    async forward(q: string): Promise<ForwardGeocodeResult[]> {
      return request<ForwardGeocodeResult[]>(
        `${API_ROUTES.geocoding.forward}?q=${encodeURIComponent(q)}`,
      );
    },
  },
};
