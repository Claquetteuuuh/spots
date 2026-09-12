import { API_ROUTES, type SpotAccessibility } from "@trs/shared/constants";
import type { MapBounds, MapFilterQuery, MapPin, MapScope } from "@trs/shared/map";
import type {
  RegisterInput,
  LoginInput,
  CreateSpotInput,
  UpdateSpotInput,
  SpotQuery,
  SpotImageInput,
  ActivityKind,
} from "@trs/shared/validation";

export type MapPinsResponse =
  | {
      notModified?: false;
      items: MapPin[];
      /** The fetch hit the limit — zooming in may reveal more pins. */
      truncated: boolean;
      /** The server's tag for this exact answer — send it back to get a 304. */
      etag?: string | null;
    }
  | { notModified: true };

// ─── Spot change notifications ──────────────────────────────────────
// Anything holding spots derived data (the map's cache) listens here and
// drops it the moment a spot is created, edited or deleted from this app.

const spotsChangedListeners = new Set<() => void>();

export function onSpotsChanged(listener: () => void): () => void {
  spotsChangedListeners.add(listener);
  return () => {
    spotsChangedListeners.delete(listener);
  };
}

function emitSpotsChanged(): void {
  for (const listener of spotsChangedListeners) listener();
}

// The notifications page was read: badges listening here drop to zero.
const notificationsSeenListeners = new Set<() => void>();

export function onNotificationsSeen(listener: () => void): () => void {
  notificationsSeenListeners.add(listener);
  return () => {
    notificationsSeenListeners.delete(listener);
  };
}

// A notification was marked (un)read or dismissed: badges should re-count.
const notificationsChangedListeners = new Set<() => void>();

export function onNotificationsChanged(listener: () => void): () => void {
  notificationsChangedListeners.add(listener);
  return () => {
    notificationsChangedListeners.delete(listener);
  };
}

function emitNotificationsChanged(): void {
  for (const listener of notificationsChangedListeners) listener();
}

/** A search suggestion: a user plus why they are suggested. */
export interface SuggestedUser extends User {
  /** How many of the viewer's follows follow this person. */
  mutualCount: number;
  /** Up to two of them, by username. */
  mutualUsernames: string[];
}

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

/** Send an authenticated request, refreshing the token once on a 401. */
async function send(path: string, options: RequestInit = {}, _skipRefresh = false): Promise<Response> {
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
    // A refresh must always reach the server, never the browser's cache
    cache: "no-store",
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
      return send(path, options, true);
    } catch {
      refreshPromise = null;
      // Fall through to the normal error path
    }
  }

  return res;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _skipRefresh = false,
): Promise<T> {
  const res = await send(path, options, _skipRefresh);

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

/**
 * Where the viewer stands with another user: following them, waiting on a
 * private account to approve the request, or neither.
 */
export type FollowStatus = "ACCEPTED" | "PENDING" | null;

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
  /** Present on profile and search results for an authenticated viewer. */
  isFollowing?: boolean;
  followStatus?: FollowStatus;
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
  /** Null while unread. */
  readAt: string | null;
  /** Marked unread by hand: opening the page does not read it. */
  unreadKept: boolean;
}

/** Someone liked one of the viewer's spots. */
export interface LikeNotification {
  id: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  spot: {
    id: string;
    title: string | null;
    photoUrl: string;
  };
  createdAt: string;
  readAt: string | null;
  unreadKept: boolean;
}

/** What every notification shares: the read state a slide can flip. */
export type NotificationBase = Pick<FollowRequest, "id" | "readAt" | "unreadKept">;

export interface NotificationsData {
  pendingRequests: FollowRequest[];
  newFollowers: FollowRequest[];
  likes: LikeNotification[];
}

export interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

/** A spot as the activity page lists it. */
export interface ActivitySpot {
  id: string;
  title: string | null;
  photoUrl: string;
  city: string | null;
  country: string | null;
  userId: string;
  user: { id: string; username: string; name: string; avatarUrl: string | null };
}

export interface ActivityLike {
  id: string;
  createdAt: string;
  spot: ActivitySpot;
}

export interface ActivityPhoto {
  id: string;
  photoUrl: string;
  caption: string | null;
  createdAt: string;
  spot: ActivitySpot;
}

/** What comes back when a gallery photo is removed. */
export interface RemovedSpotImage {
  id: string;
  images: SpotImage[];
  /** The new cover, when the removed photo was it. */
  cover: { photoUrl: string; photoKey: string } | null;
}

export interface SentFollowRequest {
  id: string;
  following: {
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
  accessibility: SpotAccessibility | null;
  colors: string[];
  compositions: string[];
  tags: string[];
  images?: SpotImage[];
  createdAt: string;
  updatedAt: string;
  user?: User;
  /** Only on the detail response. */
  likeCount?: number;
  isLiked?: boolean;
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

  me: {
    /** The viewer's likes or photos, newest first. */
    async activity(
      type: ActivityKind,
      cursor?: string,
    ): Promise<PaginatedResponse<ActivityLike | ActivityPhoto>> {
      const params = new URLSearchParams({ type });
      if (cursor) params.set("cursor", cursor);
      return request<PaginatedResponse<ActivityLike | ActivityPhoto>>(
        `${API_ROUTES.me.activity}?${params}`,
      );
    },
  },

  spots: {
    /** Add an uploaded photo to the spot's gallery; answers with the whole gallery. */
    async addImage(id: string, photo: SpotImageInput): Promise<SpotImage[]> {
      const images = await request<SpotImage[]>(API_ROUTES.spots.images(id), {
        method: "POST",
        body: JSON.stringify(photo),
      });
      emitSpotsChanged();
      return images;
    },

    /** Take a photo out of the gallery (the file goes too). */
    async removeImage(id: string, imageId: string): Promise<RemovedSpotImage> {
      const result = await request<RemovedSpotImage>(API_ROUTES.spots.image(id, imageId), {
        method: "DELETE",
      });
      emitSpotsChanged();
      return result;
    },

    async like(id: string): Promise<LikeState> {
      return request<LikeState>(API_ROUTES.spots.like(id), { method: "POST" });
    },

    async unlike(id: string): Promise<LikeState> {
      return request<LikeState>(API_ROUTES.spots.like(id), { method: "DELETE" });
    },

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
      const spot = await request<Spot>(API_ROUTES.spots.create, {
        method: "POST",
        body: JSON.stringify(data),
      });
      emitSpotsChanged();
      return spot;
    },

    async get(id: string): Promise<Spot> {
      return request<Spot>(API_ROUTES.spots.detail(id));
    },

    async update(id: string, data: UpdateSpotInput): Promise<Spot> {
      const spot = await request<Spot>(API_ROUTES.spots.detail(id), {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      emitSpotsChanged();
      return spot;
    },

    async delete(id: string): Promise<void> {
      await request<void>(API_ROUTES.spots.detail(id), {
        method: "DELETE",
      });
      emitSpotsChanged();
    },

    async searchTags(query: string): Promise<string[]> {
      return request<string[]>(
        `${API_ROUTES.spots.tags}?q=${encodeURIComponent(query)}`,
      );
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

    async deletePhoto(spotId: string, photoId: string): Promise<void> {
      await request<void>(API_ROUTES.spots.photo(spotId, photoId), {
        method: "DELETE",
      });
    },

    /**
     * Lightweight pins inside a viewport — own spots first, then followed.
     * Pass the ETag of what you hold and the server answers 304 when it
     * still stands, with no body to download.
     */
    async map(
      query: MapBounds & MapFilterQuery & { scope?: MapScope; limit?: number },
      opts: { etag?: string | null } = {},
    ): Promise<MapPinsResponse> {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) params.set(k, String(v));
      }
      const res = await send(`${API_ROUTES.spots.map}?${params.toString()}`, {
        headers: opts.etag ? { "If-None-Match": opts.etag } : undefined,
      });
      if (res.status === 304) return { notModified: true };
      const json = (await res.json()) as ApiResponse<{ items: MapPin[]; truncated: boolean }>;
      if (!res.ok || json.error || !json.data) {
        throw new Error(json.error ?? `Request failed (${res.status})`);
      }
      return { ...json.data, etag: res.headers.get("etag") };
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
    /** People the viewer may know — followed by the people they follow. */
    async suggestions(): Promise<SuggestedUser[]> {
      return request<SuggestedUser[]>(API_ROUTES.users.suggestions);
    },

    async profile(username: string): Promise<User> {
      return request<User>(API_ROUTES.users.profile(username));
    },

    /**
     * Resolves with the resulting status: `ACCEPTED` straight away for a
     * public account, `PENDING` while a private one decides.
     */
    async follow(
      username: string,
    ): Promise<{ status: NonNullable<FollowStatus> }> {
      const follow = await request<{ status: NonNullable<FollowStatus> }>(
        API_ROUTES.users.follow(username),
        { method: "POST" },
      );
      return { status: follow.status };
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
    /** The notifications page is open: what was never read is read now. */
    async markSeen(): Promise<void> {
      for (const listener of notificationsSeenListeners) listener();
      await request<{ count: number }>(API_ROUTES.followRequests.seen, { method: "POST" });
    },

    /** Mark one notification read or unread. */
    async setRead(id: string, read: boolean): Promise<void> {
      await request<{ id: string }>(API_ROUTES.followRequests.read(id), {
        method: "PATCH",
        body: JSON.stringify({ read }),
      });
      emitNotificationsChanged();
    },

    /** Take one notification off the list for good. */
    async dismiss(id: string): Promise<void> {
      await request<{ id: string }>(API_ROUTES.followRequests.dismiss(id), { method: "POST" });
      emitNotificationsChanged();
    },

    async list(): Promise<NotificationsData> {
      return request<NotificationsData>(API_ROUTES.followRequests.list);
    },

    async count(): Promise<number> {
      const res = await request<{ count: number }>(API_ROUTES.followRequests.count);
      return res.count;
    },

    async sent(): Promise<SentFollowRequest[]> {
      return request<SentFollowRequest[]>(API_ROUTES.followRequests.sent);
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

    /**
     * Throw away staged photos that will never be attached to a spot —
     * call it when creating the spot fails after the uploads went through.
     */
    async discard(keys: string[]): Promise<void> {
      if (keys.length === 0) return;
      await request<{ deleted: string[] }>(API_ROUTES.upload.photo, {
        method: "DELETE",
        body: JSON.stringify({ keys }),
      });
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
