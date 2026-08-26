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

export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Verify a Google ID token and return the user info payload.
 * Throws if the token is invalid, expired, or not issued for our app.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUserInfo> {
  const client = getClient();
  const clientId = process.env.GOOGLE_CLIENT_ID!;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
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
