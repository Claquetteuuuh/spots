import type { CompositionType, SpotAccessibility } from "@trs/shared/constants";

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
  isPrivate?: boolean;
  createdAt: string;
  followerCount?: number;
  followingCount?: number;
  spotCount?: number;
  isFollowing?: boolean;
  followStatus?: FollowStatus;
}

export interface FollowRequest {
  id: string;
  /** Null while unread. */
  readAt?: string | null;
  /** Marked unread by hand: opening the screen does not read it. */
  unreadKept?: boolean;
  follower: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: string;
}

/** Someone liked one of the viewer's spots. */
export interface LikeNotification {
  id: string;
  readAt?: string | null;
  unreadKept?: boolean;
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

/** A spot as the activity screen lists it. */
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
  accessibility?: SpotAccessibility | null;

  colors: string[];
  compositions: CompositionType[];
  tags: string[];
  images?: SpotImage[];
  /** Only on the detail response. */
  likeCount?: number;
  isLiked?: boolean;

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

/** A photo another user added under a spot. */
export interface SpotPhoto {
  id: string;
  spotId: string;
  userId: string;
  photoUrl: string;
  photoKey: string;
  caption: string | null;
  createdAt: string;
  user: Pick<User, "id" | "username" | "name" | "avatarUrl">;
}

/** A search suggestion: a user plus why they are suggested. */
export interface SuggestedUser extends User {
  /** How many of the viewer's follows follow this person. */
  mutualCount: number;
  /** Up to two of them, by username. */
  mutualUsernames: string[];
}

export interface MapBounds {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}
