import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

// PUT /api/storage/upload?key=[key] - Local storage upload endpoint (fallback when R2/S3 is not configured)
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

  try {
    const arrayBuffer = await req.arrayBuffer();
    const filePath = path.join(process.cwd(), ".storage", normalized);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json(
      { success: true, key: normalized, sizeBytes: arrayBuffer.byteLength },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Failed to write file in local storage:", err);
    return NextResponse.json(
      { error: "Internal Server Error: Could not save file to local storage" },
      { status: 500 }
    );
  }
}
