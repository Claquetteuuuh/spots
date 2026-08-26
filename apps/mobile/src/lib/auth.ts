import * as SecureStore from "expo-secure-store";
import type { AuthTokens } from "../types";

/**
 * Thin wrapper around expo-secure-store for persisting auth tokens.
 * Tokens are stored individually (not as one JSON blob) so either can
 * be read/cleared independently.
 */

const ACCESS_TOKEN_KEY = "trs.accessToken";
const REFRESH_TOKEN_KEY = "trs.refreshToken";

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function hasStoredSession(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}
