import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

/**
 * Payload encoded into a short-lived access token.
 */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  username: string;
}

/**
 * Payload encoded into a long-lived refresh token.
 */
export interface RefreshTokenPayload {
  userId: string;
}

/**
 * The authenticated user extracted from a request's access token.
 */
export type AuthUser = AccessTokenPayload;

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "30d";

/**
 * Thrown whenever a token is missing, malformed, expired, or signed with the
 * wrong secret. Callers should treat this the same as "not authenticated".
 */
export class AuthTokenError extends Error {
  constructor(message = "Invalid or expired token") {
    super(message);
    this.name = "AuthTokenError";
  }
}

function requireEnv(name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

export function getAccessTokenSecret(): string {
  return requireEnv("JWT_SECRET");
}

export function getRefreshTokenSecret(): string {
  return requireEnv("JWT_REFRESH_SECRET");
}

/**
 * Sign a short-lived access token used to authenticate API requests.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, getAccessTokenSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Sign a long-lived refresh token used to mint new access tokens.
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, getRefreshTokenSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify a JWT against the given secret and return its decoded payload.
 * Throws `AuthTokenError` if the token is invalid, expired, or malformed.
 */
export function verifyToken<T extends object = AccessTokenPayload>(
  token: string,
  secret: string
): T {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string" || decoded === null) {
      throw new AuthTokenError();
    }
    return decoded as T;
  } catch {
    throw new AuthTokenError();
  }
}

/**
 * Verify an access token using the JWT_SECRET environment variable.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyToken<AccessTokenPayload>(token, getAccessTokenSecret());
}

/**
 * Verify a refresh token using the JWT_REFRESH_SECRET environment variable.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return verifyToken<RefreshTokenPayload>(token, getRefreshTokenSecret());
}

/**
 * Extract the bearer token from a request's Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearerToken(request: NextRequest | Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
}

/**
 * Extract and verify the authenticated user from a request's Authorization
 * header. Returns null if there is no token or the token is invalid — it
 * never throws, making it safe to use for optional-auth routes.
 */
export async function getUserFromRequest(
  request: NextRequest | Request
): Promise<AuthUser | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}
