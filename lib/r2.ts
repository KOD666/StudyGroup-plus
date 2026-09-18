import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

let _r2Client: S3Client | null = null;

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
 * Generates a presigned URL for direct client-to-R2 upload via HTTP PUT
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
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
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Deletes an object directly from R2
 */
export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

/**
 * Uploads a text or binary blob directly to R2 (e.g. for background transcript workers)
 */
export async function putR2Blob(
  key: string,
  body: string | Uint8Array | Buffer,
  contentType = "text/plain; charset=utf-8"
): Promise<void> {
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
