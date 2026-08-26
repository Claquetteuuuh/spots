import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
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
