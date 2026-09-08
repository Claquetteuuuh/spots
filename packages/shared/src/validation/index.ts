import { z } from "zod";
import { COMPOSITION_TYPES, ACCEPTED_IMAGE_TYPES, MAX_PHOTO_SIZE_BYTES } from "../constants";

// ─── Auth ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  name: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const oauthSchema = z.object({
  token: z.string().min(1),
  provider: z.enum(["GOOGLE"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// ─── Spots ───────────────────────────────────────────────────────────

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createSpotSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  isFree: z.boolean().default(true),
  priceInfo: z.string().max(200).optional(),
  colors: z
    .array(z.string().regex(hexColorRegex, "Must be a valid hex color"))
    .max(10)
    .default([]),
  compositions: z
    .array(z.enum(COMPOSITION_TYPES))
    .max(5)
    .default([]),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10)
    .default([]),
});

export const updateSpotSchema = createSpotSchema.partial();

export const spotQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  userId: z.string().optional(),
  // Bounding box for map view
  swLat: z.coerce.number().min(-90).max(90).optional(),
  swLng: z.coerce.number().min(-180).max(180).optional(),
  neLat: z.coerce.number().min(-90).max(90).optional(),
  neLng: z.coerce.number().min(-180).max(180).optional(),
});

// ─── Users ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  bio: z.string().max(500).optional(),
  locale: z.enum(["fr", "en"]).optional(),
});

export const userSearchSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).default(10),
});

// ─── Geocoding ───────────────────────────────────────────────────────

export const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ─── Types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OAuthInput = z.infer<typeof oauthSchema>;
export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
export type SpotQuery = z.infer<typeof spotQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserSearchQuery = z.infer<typeof userSearchSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ReverseGeocodeInput = z.infer<typeof reverseGeocodeSchema>;
