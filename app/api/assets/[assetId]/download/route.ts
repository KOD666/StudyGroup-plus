import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets } from "@/models";
import { canAccessAsset } from "@/lib/permissions";
import { getPresignedDownloadUrl } from "@/lib/r2";

// GET /api/assets/[assetId]/download - Return a presigned R2 GET URL (strictly guarded)
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
    // 1. Fetch asset (must not be soft-deleted)
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

    // 3. Generate presigned download URL (valid for 1 hour / 3600 seconds)
    const downloadUrl = await getPresignedDownloadUrl(
      asset.r2Key,
      3600,
      asset.title
    );

    return NextResponse.json(
      {
        downloadUrl,
        r2Key: asset.r2Key,
        filename: asset.title,
        fileType: asset.fileType,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        expiresIn: 3600,
      },
      {
        status: 200,
        headers: {
          "X-Content-Type-Options": "nosniff",
        },
      }
    );
  } catch (error) {
    console.error("Failed to generate asset download URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not generate download URL" },
      { status: 500 }
    );
  }
}
