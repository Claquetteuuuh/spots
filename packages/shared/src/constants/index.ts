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
    like: (id: string) => `/api/spots/${id}/like`,
    images: (id: string) => `/api/spots/${id}/images`,
    image: (id: string, imageId: string) => `/api/spots/${id}/images/${imageId}`,
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
    suggestions: "/api/users/suggestions",
  },
  me: {
    activity: "/api/me/activity",
  },
  followRequests: {
    list: "/api/follow-requests",
    count: "/api/follow-requests/count",
    sent: "/api/follow-requests/sent",
    seen: "/api/follow-requests/seen",
    read: (id: string) => `/api/follow-requests/${id}/read`,
    dismiss: (id: string) => `/api/follow-requests/${id}/dismiss`,
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

// ─── Spot accessibility ──────────────────────────────────────────────

/** How hard a spot is to reach, from a short stroll to private land. */
export const SPOT_ACCESSIBILITY = ["EASY", "MODERATE", "HARD", "RESTRICTED", "PRIVATE"] as const;
export type SpotAccessibility = (typeof SPOT_ACCESSIBILITY)[number];

// ─── Map filters ─────────────────────────────────────────────────────

/**
 * The map filter's palette: across the spectrum, then the earth tones,
 * pastels and neutrals photographers actually shoot. Each swatch matches
 * every nearby shade (see `colorsAlike`); the wheel covers the rest.
 */
export const FILTER_PALETTE = [
  { key: "red", hex: "#D32F2F" },
  { key: "brick", hex: "#C44536" },
  { key: "orange", hex: "#E67E22" },
  { key: "yellow", hex: "#F1C40F" },
  { key: "lime", hex: "#8BC34A" },
  { key: "green", hex: "#2E7D32" },
  { key: "mint", hex: "#2ECC71" },
  { key: "teal", hex: "#1C9C8B" },
  { key: "cyan", hex: "#2AA7D8" },
  { key: "blue", hex: "#2F6FD0" },
  { key: "indigo", hex: "#4B4FC7" },
  { key: "purple", hex: "#7E57C2" },
  { key: "fuchsia", hex: "#C837C8" },
  { key: "magenta", hex: "#C2185B" },
  { key: "pink", hex: "#E9829E" },
  { key: "brown", hex: "#8B5A2B" },
  { key: "tan", hex: "#D2B48C" },
  { key: "beige", hex: "#E8D9C3" },
  { key: "olive", hex: "#6B8E23" },
  { key: "sage", hex: "#7D8C6E" },
  { key: "navy", hex: "#1E3A8A" },
  { key: "sky", hex: "#9DB9E8" },
  { key: "lavender", hex: "#B39DDB" },
  { key: "white", hex: "#F5F5F5" },
  { key: "grey", hex: "#8A8A8A" },
  { key: "black", hex: "#1A1A1A" },
] as const;
export type FilterSwatch = (typeof FILTER_PALETTE)[number]["key"];

/** "Around me" radii offered by the map filter, in km. */
export const PROXIMITY_RADII_KM = [1, 5, 20, 50] as const;

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

/**
 * What a whole post may weigh on the wire. A serverless request body is
 * capped at 4.5 MB and the platform refuses anything larger with a bare
 * 413 — before the route sees it, so nothing kinder can be said from
 * there. Both apps shrink a post until it fits under this, with room to
 * spare for the caption and the multipart framing.
 */
export const MAX_POST_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
