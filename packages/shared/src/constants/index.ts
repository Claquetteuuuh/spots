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
  "OTHER",
] as const;

export type CompositionType = (typeof COMPOSITION_TYPES)[number];

// ─── Spot Visibility ────────────────────────────────────────────────

export const SPOT_VISIBILITIES = ["PRIVATE", "FOLLOWERS"] as const;
export type SpotVisibility = (typeof SPOT_VISIBILITIES)[number];

// ─── Design Tokens ───────────────────────────────────────────────────

/**
 * Blue and white, one brand hue and nothing else.
 *
 * The blue is taken straight from the wordmark, so the logo's dot and a
 * primary button are literally the same colour. Neutrals are cooled toward
 * that blue rather than being pure grey — surfaces read as daylight, and
 * photos (which are the actual content) never have to compete with a second
 * accent. Green and red appear only for success and failure.
 */
export const COLORS = {
  // Backgrounds — white canvas, cool near-whites for grouping
  bg: "#FFFFFF",
  bgSecondary: "#F3F6FC",
  bgTertiary: "#E5ECF8",

  // Text — blue-black rather than neutral grey, so type belongs to the palette
  text: "#16203A",
  textSecondary: "#5B6B8C",
  textTertiary: "#8A99B5",

  // Brand
  accent: "#4574C4",
  accentLight: "#7BA3E8",
  accentDark: "#33569A",
  accentTint: "#E9F0FB",

  // Borders — barely there; grouping comes from spacing, not from rules
  border: "#E2E8F4",
  borderDark: "#C3D0E4",

  // Semantic
  error: "#DC4B3E",
  errorLight: "#FDECEA",
  success: "#2E9E6B",
  successLight: "#E6F6EE",
  warning: "#E0A020",
  warningLight: "#FDF4E3",

  // Dark mode overrides — deep navy, never pure black, so the blue still sings
  dark: {
    bg: "#0D1420",
    bgSecondary: "#151E2E",
    bgTertiary: "#1E2A3D",
    text: "#EDF2FA",
    textSecondary: "#9BAAC6",
    textTertiary: "#6C7C99",
    border: "#223046",
    borderDark: "#2F4059",
    accentTint: "#1A2740",
  },
} as const;

/**
 * Corner radii. The wordmark is a circle inside a rounded face, so the
 * interface is round too: pills for anything pressable, generous radii on
 * photography, and nothing sharp.
 */
export const RADIUS = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
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
    changePassword: "/api/auth/change-password",
  },
  spots: {
    list: "/api/spots",
    create: "/api/spots",
    detail: (id: string) => `/api/spots/${id}`,
    photos: (id: string) => `/api/spots/${id}/photos`,
    photo: (id: string, photoId: string) => `/api/spots/${id}/photos/${photoId}`,
    feed: "/api/spots/feed",
    map: "/api/spots/map",
    tags: "/api/spots/tags",
  },
  users: {
    profile: (username: string) => `/api/users/${username}`,
    follow: (username: string) => `/api/users/${username}/follow`,
    unfollow: (username: string) => `/api/users/${username}/follow`,
    followers: (username: string) => `/api/users/${username}/followers`,
    following: (username: string) => `/api/users/${username}/following`,
    search: "/api/users/search",
  },
  followRequests: {
    list: "/api/follow-requests",
    count: "/api/follow-requests/count",
    sent: "/api/follow-requests/sent",
    accept: (id: string) => `/api/follow-requests/${id}/accept`,
    reject: (id: string) => `/api/follow-requests/${id}/reject`,
  },
  upload: {
    photo: "/api/upload/photo",
  },
  geocoding: {
    reverse: "/api/geocoding/reverse",
    forward: "/api/geocoding/forward",
  },
} as const;

// ─── Pagination ──────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── DiceBear Avatars ───────────────────────────────────────────────

export const DICEBEAR_STYLES = [
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "notionists",
  "open-peeps",
  "personas",
  "pixel-art",
  "thumbs",
] as const;

export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

export const DICEBEAR_BG_COLORS = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
] as const;

/**
 * Only this origin is accepted as an avatar URL — an avatar is generated,
 * never uploaded, so nothing else should ever end up in `avatarUrl`.
 */
export const DICEBEAR_ORIGIN = "https://api.dicebear.com";

/** Build a DiceBear SVG URL from a style, seed and background hex (no `#`). */
export function dicebearUrl(
  style: string,
  seed: string,
  bgColor: string,
): string {
  return `${DICEBEAR_ORIGIN}/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bgColor}`;
}

/**
 * The stored avatar is an SVG — crisp at any size on the web. React
 * Native's `<Image>` cannot render SVG, so the app asks DiceBear for the
 * same avatar as a PNG instead. Any non-DiceBear URL is returned untouched.
 */
export function dicebearRasterUrl(url: string, size = 256): string {
  if (!url.startsWith(`${DICEBEAR_ORIGIN}/`)) return url;
  const [path, query = ""] = url.split("?");
  const rasterPath = path.replace(/\/svg$/, "/png");
  const params = new URLSearchParams(query);
  params.set("size", String(size));
  return `${rasterPath}?${params.toString()}`;
}

// ─── Photo ───────────────────────────────────────────────────────────

/**
 * Upload ceiling for the *original* file. Every photo is downscaled and
 * re-encoded server-side before it reaches storage (see
 * `apps/web/src/lib/image.ts`), so this only bounds request size and
 * decode memory, not what ends up in the bucket.
 */
export const MAX_PHOTO_SIZE_MB = 20;
export const MAX_PHOTO_SIZE_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
