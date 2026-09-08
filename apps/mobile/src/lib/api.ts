import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_ROUTES, type CompositionType } from "@trs/shared/constants";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens, setAccessToken } from "./auth";
import type {
  AuthResponse,
  MapBounds,
  Paginated,
  ReverseGeocodeResult,
  Spot,
  UploadPhotoResult,
  User,
} from "../types";

/**
 * API base URL. Configure via the EXPO_PUBLIC_API_URL env var
 * (e.g. `EXPO_PUBLIC_API_URL=https://api.therightspot.app`).
 * Falls back to a local dev server for `expo start`.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

// ─── Auth token injection ────────────────────────────────────────────

client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Silent refresh on 401 ───────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data: body } = await axios.post<{ data: { accessToken: string } }>(
      `${API_URL}${API_ROUTES.auth.refresh}`,
      { refreshToken }
    );
    const newAccessToken = body.data.accessToken;
    await setAccessToken(newAccessToken);
    return newAccessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

// ─── Unwrap API envelope ─────────────────────────────────────────────
// The API returns `{ data: T }` for success responses. This interceptor
// unwraps the envelope so callers get `T` directly from `response.data`.

client.interceptors.response.use((response) => {
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    response.data = response.data.data;
  }
  return response;
});

// ─── Silent refresh on 401 ───────────────────────────────────────────

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return client.request(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
  name: string;
}

export async function login(params: LoginParams): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>(API_ROUTES.auth.login, params);
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function register(params: RegisterParams): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>(API_ROUTES.auth.register, params);
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>(API_ROUTES.auth.google, {
    token: idToken,
    provider: "GOOGLE",
  });
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>(API_ROUTES.auth.me);
  return data;
}

// ─── Spots ───────────────────────────────────────────────────────────

export interface GetSpotsParams {
  userId?: string;
  cursor?: string;
  limit?: number;
  bounds?: MapBounds;
}

export async function getSpots(params: GetSpotsParams = {}): Promise<Paginated<Spot>> {
  const { data } = await client.get<Paginated<Spot>>(API_ROUTES.spots.list, {
    params: {
      userId: params.userId,
      cursor: params.cursor,
      limit: params.limit,
      swLat: params.bounds?.swLat,
      swLng: params.bounds?.swLng,
      neLat: params.bounds?.neLat,
      neLng: params.bounds?.neLng,
    },
  });
  return data;
}

export interface CreateSpotParams {
  latitude: number;
  longitude: number;
  photoUrl: string;
  photoKey: string;
  title?: string;
  description?: string;
  isFree?: boolean;
  priceInfo?: string;
  colors?: string[];
  compositions?: CompositionType[];
  tags?: string[];
}

export async function createSpot(params: CreateSpotParams): Promise<Spot> {
  const { data } = await client.post<Spot>(API_ROUTES.spots.create, params);
  return data;
}

export async function getSpotById(id: string): Promise<Spot> {
  const { data } = await client.get<Spot>(API_ROUTES.spots.detail(id));
  return data;
}

export async function deleteSpot(id: string): Promise<void> {
  await client.delete(API_ROUTES.spots.detail(id));
}

export async function getFeed(cursor?: string, limit = 20): Promise<Paginated<Spot>> {
  const { data } = await client.get<Paginated<Spot>>(API_ROUTES.spots.feed, {
    params: { cursor, limit },
  });
  return data;
}

// ─── Users ───────────────────────────────────────────────────────────

export async function followUser(username: string): Promise<void> {
  await client.post(API_ROUTES.users.follow(username));
}

export async function unfollowUser(username: string): Promise<void> {
  await client.delete(API_ROUTES.users.unfollow(username));
}

export async function searchUsers(query: string, limit = 10): Promise<User[]> {
  const { data } = await client.get<User[]>(API_ROUTES.users.search, {
    params: { q: query, limit },
  });
  return data;
}

export async function getUserProfile(username: string): Promise<User> {
  const { data } = await client.get<User>(API_ROUTES.users.profile(username));
  return data;
}

export interface UpdateProfileParams {
  name?: string;
  username?: string;
  bio?: string;
  locale?: "fr" | "en";
}

export async function updateProfile(params: UpdateProfileParams): Promise<User> {
  const { data } = await client.patch<User>(API_ROUTES.auth.me, params);
  return data;
}

// ─── Upload ──────────────────────────────────────────────────────────

export async function uploadPhoto(uri: string, fileName = "photo.jpg"): Promise<UploadPhotoResult> {
  const formData = new FormData();
  const match = /\.(\w+)$/.exec(fileName);
  const ext = match ? match[1].toLowerCase() : "jpg";
  const mimeType = ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg";

  // React Native's FormData accepts this shape for file uploads.
  formData.append("photo", {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await client.post<UploadPhotoResult>(API_ROUTES.upload.photo, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ─── Geocoding ───────────────────────────────────────────────────────

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult> {
  const { data } = await client.get<ReverseGeocodeResult>(API_ROUTES.geocoding.reverse, {
    params: { latitude, longitude },
  });
  return data;
}
