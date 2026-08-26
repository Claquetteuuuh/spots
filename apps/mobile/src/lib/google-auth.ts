import * as Google from "expo-auth-session/providers/google";
import type { AuthSessionResult } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

/**
 * Complete any pending auth session — required for the redirect
 * to work on Android.
 */
WebBrowser.maybeCompleteAuthSession();

/**
 * Google OAuth Client IDs.
 * Set via EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (required — also used for
 * backend token verification), and optionally
 * EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 * for native flows.
 */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/**
 * Hook that wraps `Google.useAuthRequest` with the project's client IDs.
 * Returns `[request, response, promptAsync]` — identical to the raw hook.
 *
 * Usage:
 * ```ts
 * const [request, response, promptAsync] = useGoogleAuth();
 * ```
 */
export function useGoogleAuth() {
  return Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
  });
}

/**
 * Extract the Google ID token from an auth-session response.
 * Returns `null` if the user cancelled or the response is invalid.
 */
export function extractGoogleIdToken(
  response: AuthSessionResult | null
): string | null {
  if (response?.type !== "success") return null;
  return response.authentication?.idToken ?? null;
}
