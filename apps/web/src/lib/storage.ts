import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ApiError } from "./api-utils";

/** Every variable object storage needs before it can be used at all. */
const REQUIRED_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
] as const;

/**
 * Fail with something a person can act on.
 *
 * Previously the first missing variable threw a bare Error, which the API
 * error handler turned into "Internal server error" — so an unconfigured
 * deployment looked exactly like a bug, and photo upload (and therefore
 * creating a spot at all) failed with no clue why.
 */
function assertConfigured(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new ApiError(
      `Photo storage is not configured. Missing environment ${
        missing.length === 1 ? "variable" : "variables"
      }: ${missing.join(", ")}. See apps/web/.env.example.`,
      503,
    );
  }
}

function getEnvOrThrow(key: string): string {
  assertConfigured();
  return process.env[key] as string;
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  _client = new S3Client({
    region: "auto",
    endpoint: `https://${getEnvOrThrow("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: getEnvOrThrow("R2_ACCESS_KEY_ID"),
      secretAccessKey: getEnvOrThrow("R2_SECRET_ACCESS_KEY"),
    },
  });

  return _client;
}

function getBucket(): string {
  return getEnvOrThrow("R2_BUCKET_NAME");
}

function getPublicUrl(): string {
  return getEnvOrThrow("R2_PUBLIC_URL").replace(/\/+$/, "");
}

/**
 * Upload a file to Cloudflare R2.
 * Returns the public URL of the uploaded object.
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  const client = getClient();

  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return `${getPublicUrl()}/${key}`;
}

/**
 * Delete a file from Cloudflare R2.
 * Does not throw if the object doesn't exist.
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getClient();

  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    })
  );
}

/**
 * Build the public URL for a stored object key.
 */
export function getFileUrl(key: string): string {
  return `${getPublicUrl()}/${key}`;
}
