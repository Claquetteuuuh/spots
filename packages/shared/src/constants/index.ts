// ─── Composition Types ───────────────────────────────────────────────

export const COMPOSITION_TYPES = [
  "SYMMETRY",
  "ASYMMETRY",
  "FRAME_IN_FRAME",
  "FIBONACCI",
  "RULE_OF_THIRDS",
  "LEADING_LINES",
  "DIAGONAL",
  "CENTERED",
  "MINIMALIST",
  "PATTERN",
] as const;

export type CompositionType = (typeof COMPOSITION_TYPES)[number];

// ─── Design Tokens ───────────────────────────────────────────────────

export const COLORS = {
  // Backgrounds
  bg: "#FAFAF8",
  bgSecondary: "#F2F0EB",
  bgTertiary: "#E8E5DE",

  // Text
  text: "#1A1A18",
  textSecondary: "#6B6960",
  textTertiary: "#9C978C",

  // Accent
  accent: "#8B7355",
  accentLight: "#B49A7A",
  accentDark: "#6B5740",

  // Sage
  sage: "#7D8C6E",
  sageLight: "#A3AE96",
  sageDark: "#5B6850",

  // Borders
  border: "#E5E2DB",
  borderDark: "#D1CCC2",

  // Semantic
  error: "#C44536",
  errorLight: "#F8E8E5",
  success: "#5B7553",
  successLight: "#E8F0E5",
  warning: "#D4A017",
  warningLight: "#FBF4E0",

  // Dark mode overrides
  dark: {
    bg: "#141413",
    bgSecondary: "#1E1E1C",
    bgTertiary: "#2A2A27",
    text: "#F2F0EB",
    textSecondary: "#9C978C",
    textTertiary: "#6B6960",
    border: "#2A2A27",
    borderDark: "#3A3A36",
  },
} as const;

// ─── API ─────────────────────────────────────────────────────────────

export const API_ROUTES = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
    google: "/api/auth/google",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
  },
  spots: {
    list: "/api/spots",
    create: "/api/spots",
    detail: (id: string) => `/api/spots/${id}`,
    feed: "/api/spots/feed",
  },
  users: {
    profile: (username: string) => `/api/users/${username}`,
    follow: (username: string) => `/api/users/${username}/follow`,
    unfollow: (username: string) => `/api/users/${username}/follow`,
    followers: (username: string) => `/api/users/${username}/followers`,
    following: (username: string) => `/api/users/${username}/following`,
    search: "/api/users/search",
  },
  upload: {
    photo: "/api/upload/photo",
    avatar: "/api/upload/avatar",
  },
  geocoding: {
    reverse: "/api/geocoding/reverse",
  },
} as const;

// ─── Pagination ──────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── Photo ───────────────────────────────────────────────────────────

export const MAX_PHOTO_SIZE_MB = 10;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const MAX_AVATAR_SIZE_MB = 2;
export const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
