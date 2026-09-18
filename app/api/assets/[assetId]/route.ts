import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets } from "@/models";
import { canAccessAsset, isGroupCreator } from "@/lib/permissions";

// GET /api/assets/[assetId] - Get asset metadata (strictly gated by canAccessAsset)
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

    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch asset:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch asset" },
      { status: 500 }
    );
  }
}

// DELETE /api/assets/[assetId] - Soft-delete asset (uploader or group creator only)
export async function DELETE(
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
    // 1. Fetch asset
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

    // 2. Permission check: Only asset uploader or group creator can delete
    const isCreator = await isGroupCreator(currentUserId, asset.groupId);
    const isUploader = asset.uploaderId === currentUserId;

    if (!isCreator && !isUploader) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only the asset uploader or group creator can delete this asset",
        },
        { status: 403 }
      );
    }

    // 3. Soft-delete
    await db
      .update(assets)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(assets.id, assetId));

    return NextResponse.json(
      { message: "Asset deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not delete asset" },
      { status: 500 }
    );
  }
}
