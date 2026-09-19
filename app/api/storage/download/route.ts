import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

// GET /api/storage/download?key=[key]&filename=[filename]&inline=[true|false]
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const filename = searchParams.get("filename") || "document";
  const isInline = searchParams.get("inline") === "true";

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

  const filePath = path.join(process.cwd(), ".storage", normalized);

  try {
    const fileBuffer = await fs.promises.readFile(filePath);

    // Determine appropriate Content-Type
    const lowerKey = normalized.toLowerCase();
    let contentType = "application/octet-stream";
    if (lowerKey.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (lowerKey.endsWith(".md")) {
      contentType = "text/markdown; charset=utf-8";
    } else if (lowerKey.endsWith(".pptx")) {
      contentType =
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    } else if (lowerKey.endsWith(".txt")) {
      contentType = "text/plain; charset=utf-8";
    }

    const safeFilename = filename.replace(/["\r\n]/g, "");
    const disposition = isInline
      ? "inline"
      : `attachment; filename="${encodeURIComponent(safeFilename)}"`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return NextResponse.json(
        {
          error:
            "Not Found: File not found in local storage. It may need to be uploaded again.",
        },
        { status: 404 }
      );
    }

    console.error("Failed to read file from local storage:", err);
    return NextResponse.json(
      { error: "Internal Server Error: Could not read file from storage" },
      { status: 500 }
    );
  }
}
