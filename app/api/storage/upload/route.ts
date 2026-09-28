import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// PUT /api/storage/upload?key=[key] - Local storage upload endpoint with server-side content verification
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return NextResponse.json(
      { error: "Bad Request: Missing key query parameter" },
      { status: 400 }
    );
  }

  // Security check: prevent directory traversal
  if (key.includes("..") || path.isAbsolute(key)) {
    return NextResponse.json(
      { error: "Forbidden: Invalid storage key path" },
      { status: 403 }
    );
  }

  const normalized = path.normalize(key).replace(/^\/+/, "");
  const lowerKey = normalized.toLowerCase();

  // Enforce disallowed file extensions (HTML, SVG, executables)
  if (
    lowerKey.endsWith(".html") ||
    lowerKey.endsWith(".htm") ||
    lowerKey.endsWith(".svg") ||
    lowerKey.endsWith(".exe") ||
    lowerKey.endsWith(".sh") ||
    lowerKey.endsWith(".js")
  ) {
    return NextResponse.json(
      { error: "Validation Error: HTML, SVG, and script uploads are forbidden" },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await req.arrayBuffer();
    const sizeBytes = arrayBuffer.byteLength;

    // Enforce size limit on server
    if (sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Validation Error: File size must be between 1 byte and ${MAX_FILE_SIZE_BYTES} bytes (5MB)`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);

    // Deep content inspection: check magic bytes and reject embedded script/HTML/SVG
    const headerSnippet = buffer.subarray(0, 512).toString("utf-8").toLowerCase();
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

    // PDF magic bytes check
    if (lowerKey.endsWith(".pdf")) {
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
    if (lowerKey.endsWith(".pptx")) {
      const isZip =
        buffer.length >= 4 &&
        buffer[0] === 0x50 && // P
        buffer[1] === 0x4b && // K
        buffer[2] === 0x03 &&
        buffer[3] === 0x04;
      if (!isZip) {
        return NextResponse.json(
          { error: "Validation Error: File content is not a valid PPTX document" },
          { status: 400 }
        );
      }
    }

    const filePath = path.join(process.cwd(), ".storage", normalized);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);

    return NextResponse.json(
      { success: true, key: normalized, sizeBytes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to write file in local storage:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not save file to local storage" },
      { status: 500 }
    );
  }
}
