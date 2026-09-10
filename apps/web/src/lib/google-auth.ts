import { OAuth2Client } from "google-auth-library";

let _client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (_client) return _client;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
  }
  _client = new OAuth2Client(clientId);
  return _client;
}

/**
 * Every OAuth client that may have minted the ID token we are handed.
 *
 * The web app signs in through the Web client, but the mobile app goes
 * through Google's native flow, and an ID token obtained that way carries
 * the iOS or Android client ID as its `aud`. Verifying against the Web ID
 * alone would reject every mobile sign-in with "invalid token".
 */
export function getGoogleAudiences(): string[] {
  const webClientId = process.env.GOOGLE_CLIENT_ID;
  if (!webClientId) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
  }
  return [webClientId, process.env.GOOGLE_IOS_CLIENT_ID, process.env.GOOGLE_ANDROID_CLIENT_ID].filter(
    (id): id is string => Boolean(id),
  );
}

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Verify a Google ID token and return the user info payload.
 * Throws if the token is invalid, expired, or not issued for one of our
 * OAuth clients (web, iOS or Android).
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  const client = getClient();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: getGoogleAudiences(),
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google ID token payload");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split("@")[0],
    picture: payload.picture,
    email_verified: payload.email_verified,
  };
}
