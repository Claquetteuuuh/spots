import type { CompositionType } from "@trs/shared/constants";

export type { CompositionType };

export type FollowStatus = "ACCEPTED" | "PENDING" | null;

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  locale: "fr" | "en";
  provider?: string;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
  spotCount?: number;
  isFollowing?: boolean;
  followStatus?: FollowStatus;
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
  visibility?: "PRIVATE" | "FOLLOWERS";
  customComposition?: string | null;

  colors: string[];
  compositions: CompositionType[];
  tags: string[];
  images?: SpotImage[];

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

export interface ForwardGeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
  city: string | null;
  country: string | null;
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
