import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isGroupMember } from "@/lib/permissions";
import { generateRandomR2Key, getPresignedUploadUrl } from "@/lib/r2";
import { SupportedFileType } from "@/models";

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

interface UploadUrlRequest {
  groupId?: string;
  filename?: string;
  sizeBytes?: number;
  fileType?: string;
}

// POST /api/assets/upload-url - Issue a presigned R2 upload URL with strict type & size validation
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  let body: UploadUrlRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { groupId, filename, sizeBytes } = body;

  // 1. Validate required fields
  if (!groupId || typeof groupId !== "string") {
    return NextResponse.json(
      { error: "Validation Error: groupId is required" },
      { status: 400 }
    );
  }

  if (!filename || typeof filename !== "string") {
    return NextResponse.json(
      { error: "Validation Error: filename is required" },
      { status: 400 }
    );
  }

  if (typeof sizeBytes !== "number" || sizeBytes <= 0) {
    return NextResponse.json(
      { error: "Validation Error: sizeBytes must be a positive number" },
      { status: 400 }
    );
  }

  // 2. Server-side size validation (≤ 5MB)
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        error: `Validation Error: File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed limit of 5MB`,
      },
      { status: 400 }
    );
  }

  // 3. Server-side file extension & type validation
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
  const currentUserId = authResult.context.userId;

  try {
    // 4. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 5. Generate unguessable random R2 key
    const r2Key = generateRandomR2Key("assets", matchedExt);

    // 6. Issue presigned PUT URL
    const uploadUrl = await getPresignedUploadUrl(r2Key, fileConfig.mime, 3600);

    return NextResponse.json(
      {
        uploadUrl,
        r2Key,
        fileType: fileConfig.type,
        mimeType: fileConfig.mime,
        sizeBytes,
        expiresIn: 3600,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to generate presigned upload URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not generate upload URL" },
      { status: 500 }
    );
  }
}
