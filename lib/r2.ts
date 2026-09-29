import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import fs from "fs";
import path from "path";

let _r2Client: S3Client | null = null;
let _corsEnsured = false;

/**
 * Returns the storage base directory for local disk fallback.
 * Uses /tmp/.storage on Vercel/serverless environments to avoid read-only filesystem errors.
 */
export function getLocalStorageDir(): string {
  if (process.env.STORAGE_LOCAL_DIR) {
    return process.env.STORAGE_LOCAL_DIR;
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", ".storage");
  }
  return path.join(process.cwd(), ".storage");
}

/**
 * Checks whether the application should use local disk storage fallback.
 * Uses local storage when explicitly configured (STORAGE_DRIVER=local or USE_LOCAL_STORAGE=true),
 * or when S3 credentials are missing or set to unentitled placeholder values.
 */
export function isLocalStorage(): boolean {
  if (
    process.env.STORAGE_DRIVER === "local" ||
    process.env.USE_LOCAL_STORAGE === "true"
  ) {
    return true;
  }

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
  const endpoint =
    process.env.STORAGE_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return true;
  }

  // Placeholder credentials that are known to be unentitled
  if (
    accessKeyId.includes("placeholder") ||
    accessKeyId.startsWith("your-") ||
    accessKeyId === "dev"
  ) {
    return true;
  }

  return false;
}

export function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  const endpoint =
    process.env.STORAGE_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || process.env.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || process.env.STORAGE_SECRET_ACCESS_KEY;
  const region = process.env.STORAGE_REGION || process.env.R2_REGION || "auto";

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Object storage credentials (R2_ENDPOINT/STORAGE_ENDPOINT or R2_ACCOUNT_ID, plus access key and secret) are not set"
    );
  }

  _r2Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _r2Client;
}

export function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET || process.env.STORAGE_BUCKET;
  if (!bucket) {
    throw new Error(
      "Storage bucket name (R2_BUCKET or STORAGE_BUCKET) is not set"
    );
  }
  return bucket;
}

/**
 * Generates a cryptographically random, unguessable R2 object key
 */
export function generateRandomR2Key(prefix = "assets", extension = ""): string {
  const uuid = crypto.randomUUID();
  const cleanExt = extension
    ? extension.startsWith(".")
      ? extension
      : `.${extension}`
    : "";
  return `${prefix}/${uuid}${cleanExt}`;
}

/**
 * Ensures standard CORS configuration is applied to the S3/R2/B2 bucket
 * allowing browser uploads and downloads.
 */
export async function ensureBucketCors(): Promise<void> {
  if (_corsEnsured || isLocalStorage()) return;
  try {
    const client = getR2Client();
    const bucket = getR2BucketName();
    await client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["HEAD", "POST", "GET", "PUT"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    _corsEnsured = true;
  } catch (err) {
    // If the storage provider key has restricted permissions (e.g. read/write only, no PutBucketCors),
    // do not crash the app. The bucket may already have CORS configured or server fallback will handle it.
    console.warn(
      "Storage CORS configuration notice:",
      (err as Error)?.message || err
    );
  }
}

/**
 * Generates a presigned URL for direct client-to-R2 upload via HTTP PUT
 * (or returns the local storage upload endpoint when fallback is active)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  if (isLocalStorage()) {
    return `/api/storage/upload?key=${encodeURIComponent(key)}`;
  }

  // Ensure bucket has CORS configured for browser uploads (runs at most once)
  if (!_corsEnsured) {
    await ensureBucketCors();
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generates a presigned URL for secure temporary download/reading
 * (or returns the local storage download endpoint when fallback is active)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
  filename?: string
): Promise<string> {
  if (isLocalStorage()) {
    const fnParam = filename ? `&filename=${encodeURIComponent(filename)}` : "";
    return `/api/storage/download?key=${encodeURIComponent(key)}${fnParam}`;
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Deletes an object directly from storage (local disk or R2)
 */
export async function deleteR2Object(key: string): Promise<void> {
  if (isLocalStorage()) {
    const cleanKey = key.replace(/^\/+/, "");
    const filePath = path.join(getLocalStorageDir(), cleanKey);
    try {
      await fs.promises.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
    return;
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Uploads a text or binary blob directly to storage (local disk or R2)
 */
export async function putR2Blob(
  key: string,
  body: string | Uint8Array | Buffer,
  contentType = "text/plain; charset=utf-8"
): Promise<void> {
  if (isLocalStorage()) {
    const cleanKey = key.replace(/^\/+/, "");
    const filePath = path.join(getLocalStorageDir(), cleanKey);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from(body));
    return;
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await client.send(command);
}

/**
 * Retrieves a stored object as a Buffer (local disk or R2)
 */
export async function getR2Blob(
  key: string
): Promise<{ buffer: Buffer; contentType?: string } | null> {
  if (isLocalStorage()) {
    const cleanKey = key.replace(/^\/+/, "");
    const filePath = path.join(getLocalStorageDir(), cleanKey);
    try {
      const buffer = await fs.promises.readFile(filePath);
      return { buffer };
    } catch {
      return null;
    }
  }

  const client = getR2Client();
  const bucket = getR2BucketName();

  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!res.Body) return null;
    const byteArray = await res.Body.transformToByteArray();
    return { buffer: Buffer.from(byteArray), contentType: res.ContentType };
  } catch {
    return null;
  }
}
