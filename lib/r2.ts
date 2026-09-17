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

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are not set"
    );
  }

  _r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return _r2Client;
}

export function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) {
    throw new Error("R2_BUCKET environment variable is not set");
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
