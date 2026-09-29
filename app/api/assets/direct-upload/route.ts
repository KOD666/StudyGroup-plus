import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, groups, SupportedFileType } from "@/models";
import { isGroupMember } from "@/lib/permissions";
import { generateRandomR2Key, putR2Blob } from "@/lib/r2";
import { checkRateLimit, rateLimitExceededResponse } from "@/lib/ratelimit";
import { notifyAssetUploaded } from "@/lib/notifications";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION_MAP: Record<string, { type: SupportedFileType; mime: string }> =
  {
    ".pdf": { type: "pdf", mime: "application/pdf" },
    ".md": { type: "md", mime: "text/markdown; charset=utf-8" },
    ".pptx": {
      type: "pptx",
      mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    },
  };

/**
 * POST /api/assets/direct-upload
 * Resilient server-side upload endpoint for documents.
 * Accepts multipart/form-data with `file`, `groupId`, and optional `title`.
 * Handles direct streaming to object storage without relying on client-side CORS.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  // Rate limiting check: max 15 uploads per minute per user
  const rateLimitResult = checkRateLimit(`direct_upload:${currentUserId}`, {
    windowMs: 60 * 1000,
    maxRequests: 15,
  });
  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid multipart/form-data payload" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const groupId = formData.get("groupId");
  const title = formData.get("title");

  if (!groupId || typeof groupId !== "string") {
    return NextResponse.json(
      { error: "Validation Error: groupId is required" },
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Validation Error: file is required and must be a valid file" },
      { status: 400 }
    );
  }

  const filename = file.name || "document";
  const sizeBytes = file.size;

  // 1. Validate file size (<= 5MB)
  if (sizeBytes <= 0) {
    return NextResponse.json(
      { error: "Validation Error: File cannot be empty" },
      { status: 400 }
    );
  }

  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Validation Error: File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed limit of 5MB`,
      },
      { status: 400 }
    );
  }

  // 2. Validate file extension
  const lowerFilename = filename.toLowerCase();
  const matchedExt = Object.keys(EXTENSION_MAP).find((ext) =>
    lowerFilename.endsWith(ext)
  );

  if (!matchedExt) {
    return NextResponse.json(
      {
        error:
          "Validation Error: Unsupported file type. Only PDF (.pdf), Markdown (.md), and PowerPoint (.pptx) files are permitted.",
      },
      { status: 400 }
    );
  }

  const fileConfig = EXTENSION_MAP[matchedExt]!;

  try {
    // 3. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 4. Verify group exists and is active
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 5. Read file buffer and inspect content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep content inspection: check magic bytes and reject embedded script/HTML/SVG
    const headerSnippet = buffer
      .subarray(0, 512)
      .toString("utf-8")
      .toLowerCase();

    if (
      headerSnippet.includes("<script") ||
      headerSnippet.includes("<html") ||
      headerSnippet.includes("<!doctype html") ||
      headerSnippet.includes("<svg") ||
      headerSnippet.includes("javascript:")
    ) {
      return NextResponse.json(
        { error: "Validation Error: Malicious or executable content detected" },
        { status: 400 }
      );
    }

    // PDF magic bytes check (%PDF-)
    if (lowerFilename.endsWith(".pdf")) {
      const isPdf =
        buffer.length >= 5 &&
        buffer[0] === 0x25 && // %
        buffer[1] === 0x50 && // P
        buffer[2] === 0x44 && // D
        buffer[3] === 0x46 && // F
        buffer[4] === 0x2d; // -
      if (!isPdf) {
        return NextResponse.json(
          { error: "Validation Error: File content is not a valid PDF" },
          { status: 400 }
        );
      }
    }

    // PPTX magic bytes check (ZIP format: PK\x03\x04)
    if (lowerFilename.endsWith(".pptx")) {
      const isZip =
        buffer.length >= 4 &&
        buffer[0] === 0x50 && // P
        buffer[1] === 0x4b && // K
        buffer[2] === 0x03 &&
        buffer[3] === 0x04;
      if (!isZip) {
        return NextResponse.json(
          {
            error:
              "Validation Error: File content is not a valid PPTX document",
          },
          { status: 400 }
        );
      }
    }

    // 6. Generate unguessable random R2 key
    const r2Key = generateRandomR2Key("assets", matchedExt);

    // 7. Save file directly to storage (S3/B2/R2 or local fallback)
    await putR2Blob(r2Key, buffer, fileConfig.mime);

    // 8. Register asset record in database
    const documentTitle =
      typeof title === "string" && title.trim() ? title.trim() : filename;

    const [newAsset] = await db
      .insert(assets)
      .values({
        groupId,
        uploaderId: currentUserId,
        title: documentTitle,
        fileType: fileConfig.type,
        sizeBytes,
        r2Key,
        mimeType: fileConfig.mime,
      })
      .returning();

    if (!newAsset) {
      return NextResponse.json(
        { error: "Internal Server Error: Failed to create asset record" },
        { status: 500 }
      );
    }

    // 9. Dispatch notification to group members
    await notifyAssetUploaded({
      groupId,
      assetId: newAsset.id,
      assetTitle: newAsset.title,
      uploaderUserId: currentUserId,
    });

    return NextResponse.json(
      {
        success: true,
        asset: newAsset,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to direct-upload asset:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not upload and save asset" },
      { status: 500 }
    );
  }
}
