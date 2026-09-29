import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets } from "@/models";
import { canAccessAsset } from "@/lib/permissions";
import { getR2Blob } from "@/lib/r2";

// GET /api/assets/[assetId]/raw - Stream raw asset content from storage (server proxy)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { assetId } = await params;
  if (!assetId) {
    return NextResponse.json(
      { error: "Bad Request: Missing assetId parameter" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    // 1. Fetch asset record
    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), isNull(assets.deletedAt)))
      .limit(1);

    if (!asset) {
      return NextResponse.json(
        { error: "Not Found: Asset not found" },
        { status: 404 }
      );
    }

    // 2. Permission check: caller must have access to this asset
    const hasAccess = await canAccessAsset(currentUserId, assetId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this asset" },
        { status: 403 }
      );
    }

    // 3. Fetch blob from storage
    const blobResult = await getR2Blob(asset.r2Key);
    if (!blobResult) {
      return NextResponse.json(
        { error: "Not Found: File content not found in storage" },
        { status: 404 }
      );
    }

    const contentType =
      asset.mimeType ||
      blobResult.contentType ||
      (asset.fileType === "pdf"
        ? "application/pdf"
        : asset.fileType === "md"
          ? "text/markdown; charset=utf-8"
          : "application/octet-stream");

    const { searchParams } = new URL(_req.url);
    const isDownload = searchParams.get("download") === "true";
    const dispositionType = isDownload ? "attachment" : "inline";

    return new NextResponse(new Uint8Array(blobResult.buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(asset.title)}"`,
        "Content-Length": blobResult.buffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
      },
    });
  } catch (error) {
    console.error("Failed to read raw asset content:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not retrieve asset content" },
      { status: 500 }
    );
  }
}
