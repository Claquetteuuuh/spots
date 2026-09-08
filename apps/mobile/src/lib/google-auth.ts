import * as Google from "expo-auth-session/providers/google";
import type { AuthSessionResult } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

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
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "";

/**
 * Whether Google auth can work on the current platform.
 * Requires the web client ID plus the platform-specific one.
 */
function hasRequiredClientIds(): boolean {
  if (!WEB_CLIENT_ID) return false;
  if (Platform.OS === "ios") return Boolean(IOS_CLIENT_ID);
  if (Platform.OS === "android") return Boolean(ANDROID_CLIENT_ID);
  // Web / Expo Go on desktop — web client ID is enough
  return true;
}

export const isGoogleAuthAvailable = hasRequiredClientIds();

/**
 * Build the config object for Google.useAuthRequest.
 *
 * expo-auth-session throws at hook init time if the platform-specific
 * client ID (iosClientId on iOS, androidClientId on Android) is missing.
 * Since hooks can't be called conditionally, we pass a placeholder
 * ("NOT_CONFIGURED") when the real ID isn't set. The hook won't throw,
 * but `request` will be null — and `isGoogleAuthAvailable` prevents the
 * user from ever triggering the flow.
 */
function buildAuthConfig() {
  return {
    webClientId: WEB_CLIENT_ID || "NOT_CONFIGURED",
    iosClientId: IOS_CLIENT_ID || "NOT_CONFIGURED",
    androidClientId: ANDROID_CLIENT_ID || "NOT_CONFIGURED",
  } satisfies Partial<Google.GoogleAuthRequestConfig>;
}

/**
 * Hook that wraps `Google.useAuthRequest` with the project's client IDs.
 * Returns `[request, response, promptAsync]` — identical to the raw hook.
 *
 * Check `isGoogleAuthAvailable` before rendering the sign-in button;
 * the hook itself is safe to call unconditionally (React rules of hooks).
 */
export function useGoogleAuth() {
  return Google.useAuthRequest(buildAuthConfig());
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
