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

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setToken(token: string): void {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
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

async function request<T>(
  path: string,
  options: RequestInit = {},
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

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || json.error) {
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
  createdAt: string;
  _count?: {
    spots: number;
    followers: number;
    following: number;
  };
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
  colors: string[];
  compositions: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  user?: User;
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
      return res;
    },

    async loginWithGoogle(token: string): Promise<AuthResponse> {
      const res = await request<AuthResponse>(API_ROUTES.auth.google, {
        method: "POST",
        body: JSON.stringify({ token, provider: "GOOGLE" }),
      });
      setToken(res.accessToken);
      return res;
    },

    async me(): Promise<User> {
      return request<User>(API_ROUTES.auth.me);
    },

    logout(): void {
      clearToken();
    },

    async refresh(): Promise<AuthResponse> {
      const res = await request<AuthResponse>(API_ROUTES.auth.refresh, {
        method: "POST",
      });
      setToken(res.accessToken);
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

    async create(data: CreateSpotInput & { photoUrl: string; photoKey: string }): Promise<Spot> {
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

  upload: {
    async photo(file: File): Promise<{ url: string; key: string }> {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ url: string; key: string }>(
        API_ROUTES.upload.photo,
        {
          method: "POST",
          body: formData,
        },
      );
    },
  },
};
