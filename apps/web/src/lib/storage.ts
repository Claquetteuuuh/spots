import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
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

/** S3 refuses more keys than this in a single DeleteObjects call. */
const DELETE_BATCH_SIZE = 1000;

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
 * Delete many objects in as few round-trips as possible. Duplicates and
 * empty keys are dropped; an empty list is a no-op that never touches the
 * network. Throws if the bucket reports a per-key failure, naming the keys.
 */
export async function deleteFiles(keys: readonly string[]): Promise<void> {
  const unique = [...new Set(keys.filter((key) => key.length > 0))];
  if (unique.length === 0) return;

  const client = getClient();
  const bucket = getBucket();

  for (let i = 0; i < unique.length; i += DELETE_BATCH_SIZE) {
    const chunk = unique.slice(i, i + DELETE_BATCH_SIZE);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      })
    );

    const errors = result.Errors ?? [];
    if (errors.length > 0) {
      const detail = errors.map((e) => `${e.Key} (${e.Code})`).join(", ");
      throw new Error(`Failed to delete ${errors.length} object(s): ${detail}`);
    }
  }
}

export interface StoredObject {
  key: string;
  size: number;
  lastModified: Date;
}

/**
 * Every object in the bucket, optionally under `prefix`. Pages through the
 * listing so callers get one flat array. Meant for maintenance (orphan
 * sweeps), not request handling.
 */
export async function listAllObjects(prefix?: string): Promise<StoredObject[]> {
  const client = getClient();
  const bucket = getBucket();
  const objects: StoredObject[] = [];
  let continuationToken: string | undefined;

  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );

    for (const item of page.Contents ?? []) {
      if (!item.Key) continue;
      objects.push({
        key: item.Key,
        size: item.Size ?? 0,
        lastModified: item.LastModified ?? new Date(0),
      });
    }

    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);

  return objects;
}

/**
 * Build the public URL for a stored object key.
 */
export function getFileUrl(key: string): string {
  return `${getPublicUrl()}/${key}`;
}

/**
 * The object key behind one of *our* public URLs — `null` for anything
 * else (a DiceBear avatar, an external image, storage not configured).
 * Lets callers clean up a stored file from the URL a row holds without
 * ever deleting something that was never ours.
 */
export function keyFromUrl(url: string | null | undefined): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (!url || !publicUrl) return null;

  const base = `${publicUrl}/`;
  if (!url.startsWith(base)) return null;

  const key = url.slice(base.length).split(/[?#]/)[0];
  if (!key) return null;

  try {
    return decodeURIComponent(key);
  } catch {
    return null;
  }
}
