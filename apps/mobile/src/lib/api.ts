import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_ROUTES, type CompositionType, type SpotAccessibility } from "@trs/shared/constants";
import type { ActivityKind } from "@trs/shared/validation";
import { MAP_PINS_LIMIT, type MapFilterQuery, type MapPin, type MapScope } from "@trs/shared/map";
import type { SuggestedUser } from "../types";
import { getAccessToken, getRefreshToken, saveTokens, clearTokens, setAccessToken } from "./auth";
import type {
  AuthResponse,
  ForwardGeocodeResult,
  MapBounds,
  NotificationsData,
  LikeState,
  ActivityLike,
  ActivityPhoto,
  RemovedSpotImage,
  SpotImage,
  Paginated,
  ReverseGeocodeResult,
  SentFollowRequest,
  Spot,
  SpotPhoto,
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
  photos?: { url: string; key: string }[];
  visibility?: "PRIVATE" | "FOLLOWERS";
  customComposition?: string;
  accessibility?: SpotAccessibility | null;
}

export async function createSpot(params: CreateSpotParams): Promise<Spot> {
  const { data } = await client.post<Spot>(API_ROUTES.spots.create, params);
  return data;
}

export async function getSpotById(id: string): Promise<Spot> {
  const { data } = await client.get<Spot>(API_ROUTES.spots.detail(id));
  return data;
}

export interface UpdateSpotParams {
  title?: string;
  description?: string;
  colors?: string[];
  compositions?: CompositionType[];
  tags?: string[];
  visibility?: "PRIVATE" | "FOLLOWERS";
  customComposition?: string;
  accessibility?: SpotAccessibility | null;
}

export async function updateSpot(id: string, params: UpdateSpotParams): Promise<Spot> {
  const { data } = await client.patch<Spot>(API_ROUTES.spots.detail(id), params);
  return data;
}

/** Upload a photo, then add it to the spot's gallery; answers with the whole gallery. */
export async function addSpotImage(id: string, uri: string, fileName = "photo.jpg"): Promise<SpotImage[]> {
  const uploaded = await uploadPhoto(uri, fileName);
  const { data } = await client.post<SpotImage[]>(API_ROUTES.spots.images(id), uploaded);
  return data;
}

/** Take a photo out of the gallery (the file goes too). */
export async function removeSpotImage(id: string, imageId: string): Promise<RemovedSpotImage> {
  const { data } = await client.delete<RemovedSpotImage>(API_ROUTES.spots.image(id, imageId));
  return data;
}

/** The viewer's likes or photos, newest first. */
export async function getActivity(
  type: ActivityKind,
  cursor?: string,
): Promise<Paginated<ActivityLike | ActivityPhoto>> {
  const { data } = await client.get<Paginated<ActivityLike | ActivityPhoto>>(API_ROUTES.me.activity, {
    params: { type, cursor },
  });
  return data;
}

/** Like a spot — your own included. */
export async function likeSpot(id: string): Promise<LikeState> {
  const { data } = await client.post<LikeState>(API_ROUTES.spots.like(id));
  return data;
}

/** Take a like back. */
export async function unlikeSpot(id: string): Promise<LikeState> {
  const { data } = await client.delete<LikeState>(API_ROUTES.spots.like(id));
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

export interface GetMapPinsParams {
  bounds: MapBounds;
  scope?: MapScope;
  limit?: number;
  /** Server-side filters (compositions, accessibility, "around me"). */
  filters?: MapFilterQuery;
  /** The ETag of what we already hold for this query — a 304 means "still that". */
  etag?: string | null;
}

export type MapPinsPage =
  | {
      notModified: false;
      items: MapPin[];
      /** The fetch hit the limit — zooming in may reveal more pins. */
      truncated: boolean;
      etag: string | null;
    }
  | { notModified: true };

/** Lightweight pins inside a viewport — own spots first, then followed. */
export async function getMapPins({
  bounds,
  scope = "all",
  limit = MAP_PINS_LIMIT,
  filters = {},
  etag,
}: GetMapPinsParams): Promise<MapPinsPage> {
  const res = await client.get<{ items: MapPin[]; truncated: boolean }>(API_ROUTES.spots.map, {
    params: { ...bounds, ...filters, scope, limit },
    headers: etag ? { "If-None-Match": etag } : undefined,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 304,
  });
  if (res.status === 304) return { notModified: true };
  return {
    notModified: false,
    items: res.data.items,
    truncated: res.data.truncated,
    etag: (res.headers?.etag as string | undefined) ?? null,
  };
}

export async function searchTags(query: string): Promise<string[]> {
  const { data } = await client.get<string[]>(API_ROUTES.spots.tags, {
    params: { q: query },
  });
  return data;
}

// ─── Users ───────────────────────────────────────────────────────────

export async function followUser(username: string): Promise<{ status: string }> {
  const { data } = await client.post<{ status: string }>(API_ROUTES.users.follow(username));
  return data;
}

export async function unfollowUser(username: string): Promise<void> {
  await client.delete(API_ROUTES.users.unfollow(username));
}

export async function getFollowers(username: string): Promise<User[]> {
  const { data } = await client.get<User[]>(API_ROUTES.users.followers(username));
  return data;
}

export async function getFollowing(username: string): Promise<User[]> {
  const { data } = await client.get<User[]>(API_ROUTES.users.following(username));
  return data;
}

/** The notifications screen was read: the badge starts over from now. */
export async function markNotificationsSeen(): Promise<void> {
  await client.post(API_ROUTES.followRequests.seen);
}

/** Mark one notification read or unread. */
export async function setNotificationRead(id: string, read: boolean): Promise<void> {
  await client.patch(API_ROUTES.followRequests.read(id), { read });
}

/** Take one notification off the list for good. */
export async function dismissNotification(id: string): Promise<void> {
  await client.post(API_ROUTES.followRequests.dismiss(id));
}

/** People the viewer may know — followed by the people they follow. */
export async function getUserSuggestions(): Promise<SuggestedUser[]> {
  const { data } = await client.get<SuggestedUser[]>(API_ROUTES.users.suggestions);
  return data;
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
  avatarUrl?: string | null;
  locale?: "fr" | "en";
  isPrivate?: boolean;
}

export async function updateProfile(params: UpdateProfileParams): Promise<User> {
  const { data } = await client.patch<User>(API_ROUTES.auth.me, params);
  return data;
}

// ─── Upload ──────────────────────────────────────────────────────────

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/** MIME type for a picked file, from its extension. Unknown → JPEG. */
export function mimeTypeFor(fileName: string): string {
  const match = /\.(\w+)$/.exec(fileName);
  const ext = match ? match[1].toLowerCase() : "";
  return MIME_BY_EXTENSION[ext] ?? "image/jpeg";
}

/** React Native's FormData accepts this shape for file uploads. */
function photoFormData(uri: string, fileName: string): FormData {
  const formData = new FormData();
  formData.append("photo", {
    uri,
    name: fileName,
    type: mimeTypeFor(fileName),
  } as unknown as Blob);
  return formData;
}

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

export async function uploadPhoto(uri: string, fileName = "photo.jpg"): Promise<UploadPhotoResult> {
  const { data } = await client.post<UploadPhotoResult>(
    API_ROUTES.upload.photo,
    photoFormData(uri, fileName),
    MULTIPART,
  );
  return data;
}

/**
 * Throw away staged photos that will never be attached to a spot — call it
 * when creating the spot fails after the uploads went through.
 */
export async function discardUploads(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await client.delete(API_ROUTES.upload.photo, { data: { keys } });
}

// ─── Community photos ────────────────────────────────────────────────

export async function getSpotPhotos(
  spotId: string,
  cursor?: string,
  limit = 20,
): Promise<Paginated<SpotPhoto>> {
  const { data } = await client.get<Paginated<SpotPhoto>>(API_ROUTES.spots.photos(spotId), {
    params: { cursor, limit },
  });
  return data;
}

/** A photo on its way up: where it is, and what to call it. */
export interface OutgoingPhoto {
  uri: string;
  fileName?: string;
}

/**
 * Post one to `MAX_POST_PHOTOS` photos under a spot, with a caption.
 * `onProgress` is called with the share of the body already sent, which
 * is what fills the ring on screen.
 */
export async function addSpotPhoto(
  spotId: string,
  photos: OutgoingPhoto[],
  caption?: string,
  onProgress?: (fraction: number) => void,
): Promise<SpotPhoto> {
  const formData = new FormData();
  for (const { uri, fileName = "photo.jpg" } of photos) {
    formData.append("photo", {
      uri,
      name: fileName,
      type: mimeTypeFor(fileName),
    } as unknown as Blob);
  }
  if (caption) formData.append("caption", caption);
  const { data } = await client.post<SpotPhoto>(API_ROUTES.spots.photos(spotId), formData, {
    ...MULTIPART,
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(event.loaded / event.total);
    },
  });
  onProgress?.(1);
  return data;
}

export async function deleteSpotPhoto(spotId: string, photoId: string): Promise<void> {
  await client.delete(API_ROUTES.spots.photo(spotId, photoId));
}

// ─── Follow requests ────────────────────────────────────────────────

export async function getFollowRequests(): Promise<NotificationsData> {
  const { data } = await client.get<NotificationsData>(API_ROUTES.followRequests.list);
  return data;
}

export async function getFollowRequestsCount(): Promise<number> {
  const { data } = await client.get<{ count: number }>(API_ROUTES.followRequests.count);
  return data.count;
}

export async function getSentFollowRequests(): Promise<SentFollowRequest[]> {
  const { data } = await client.get<SentFollowRequest[]>(API_ROUTES.followRequests.sent);
  return data;
}

export async function acceptFollowRequest(id: string): Promise<void> {
  await client.post(API_ROUTES.followRequests.accept(id));
}

export async function rejectFollowRequest(id: string): Promise<void> {
  await client.post(API_ROUTES.followRequests.reject(id));
}

// ─── Password ───────────────────────────────────────────────────────

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.post(API_ROUTES.auth.changePassword, { currentPassword, newPassword });
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

export async function forwardGeocode(query: string): Promise<ForwardGeocodeResult[]> {
  const { data } = await client.get<ForwardGeocodeResult[]>(API_ROUTES.geocoding.forward, {
    params: { q: query },
  });
  return data;
}
