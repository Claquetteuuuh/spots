import type { CompositionType } from "@trs/shared/constants";

export type { CompositionType };

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  locale: "fr" | "en";
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
  spotCount?: number;
  isFollowing?: boolean;
}

export interface Spot {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "username" | "name" | "avatarUrl">;

  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  country?: string | null;

  photoUrl: string;
  photoKey: string;

  title?: string | null;
  description?: string | null;
  isFree: boolean;
  priceInfo?: string | null;

  colors: string[];
  compositions: CompositionType[];
  tags: string[];

  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ReverseGeocodeResult {
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface UploadPhotoResult {
  photoUrl: string;
  photoKey: string;
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}
