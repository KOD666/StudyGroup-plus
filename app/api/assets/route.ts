import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, groups, memberships, SupportedFileType } from "@/models";
import { getGroupMembership, isGroupMember } from "@/lib/permissions";

const VALID_FILE_TYPES: readonly SupportedFileType[] = [
  "pdf",
  "md",
  "pptx",
  "transcript",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface CreateAssetRequest {
  groupId?: string;
  title?: string;
  fileType?: string;
  sizeBytes?: number;
  r2Key?: string;
  mimeType?: string;
}

// GET /api/assets?groupId=[groupId] or GET /api/assets?recent=true
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");
  const isRecent = searchParams.get("recent") === "true";

  if (!groupId && !isRecent) {
    return NextResponse.json(
      { error: "Bad Request: groupId query parameter is required" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    if (isRecent) {
      // Fetch recent assets across all groups the user is an active member of
      const userMemberships = await db
        .select({ groupId: memberships.groupId })
        .from(memberships)
        .where(eq(memberships.userId, currentUserId));

      if (userMemberships.length === 0) {
        return NextResponse.json({ assets: [] }, { status: 200 });
      }

      const memberGroupIds = userMemberships.map((m) => m.groupId);

      const recentAssets = await db
        .select({
          id: assets.id,
          groupId: assets.groupId,
          groupName: groups.name,
          uploaderId: assets.uploaderId,
          title: assets.title,
          fileType: assets.fileType,
          sizeBytes: assets.sizeBytes,
          r2Key: assets.r2Key,
          mimeType: assets.mimeType,
          createdAt: assets.createdAt,
        })
        .from(assets)
        .innerJoin(groups, eq(assets.groupId, groups.id))
        .where(
          and(
            inArray(assets.groupId, memberGroupIds),
            isNull(assets.deletedAt),
            isNull(groups.deletedAt)
          )
        )
        .orderBy(desc(assets.createdAt))
        .limit(8);

      return NextResponse.json({ assets: recentAssets }, { status: 200 });
    }

    if (!groupId) {
      return NextResponse.json(
        { error: "Bad Request: groupId query parameter is required" },
        { status: 400 }
      );
    }

    // 1. Verify membership
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 2. Verify group exists and is not deleted
    const [group] = await db
      .select({ id: groups.id, creatorId: groups.creatorId })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 3. Fetch all active assets for this group
    const groupAssets = await db
      .select()
      .from(assets)
      .where(and(eq(assets.groupId, groupId), isNull(assets.deletedAt)))
      .orderBy(desc(assets.createdAt));

    const isCreator =
      membership.role === "creator" || group.creatorId === currentUserId;

    // 4. Attach canAccess flag for each asset
    const results = groupAssets.map((asset) => {
      const hasAccess =
        isCreator ||
        asset.uploaderId === currentUserId ||
        membership.assetAccess.includes(asset.id);

      return {
        ...asset,
        canAccess: hasAccess,
      };
    });

    return NextResponse.json({ assets: results }, { status: 200 });
  } catch (error) {
    console.error("Failed to list group assets:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not list assets" },
      { status: 500 }
    );
  }
}

// POST /api/assets - Register a new asset record after direct R2 upload
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  let body: CreateAssetRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { groupId, title, fileType, sizeBytes, r2Key, mimeType } = body;

  // 1. Validation
  if (!groupId || typeof groupId !== "string") {
    return NextResponse.json(
      { error: "Validation Error: groupId is required" },
      { status: 400 }
    );
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Validation Error: title is required and cannot be empty" },
      { status: 400 }
    );
  }

  if (!fileType || !VALID_FILE_TYPES.includes(fileType as SupportedFileType)) {
    return NextResponse.json(
      {
        error: `Validation Error: fileType must be one of: ${VALID_FILE_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (
    typeof sizeBytes !== "number" ||
    sizeBytes <= 0 ||
    sizeBytes > MAX_FILE_SIZE_BYTES
  ) {
    return NextResponse.json(
      {
        error: `Validation Error: sizeBytes must be a positive integer <= ${MAX_FILE_SIZE_BYTES} bytes (5MB)`,
      },
      { status: 400 }
    );
  }

  if (!r2Key || typeof r2Key !== "string" || !r2Key.trim()) {
    return NextResponse.json(
      { error: "Validation Error: r2Key is required" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    // 2. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 3. Verify group exists and is active
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

    // 4. Create asset in DB
    const [newAsset] = await db
      .insert(assets)
      .values({
        groupId,
        uploaderId: currentUserId,
        title: title.trim(),
        fileType: fileType as SupportedFileType,
        sizeBytes,
        r2Key: r2Key.trim(),
        mimeType: mimeType || null,
      })
      .returning();

    return NextResponse.json({ asset: newAsset }, { status: 201 });
  } catch (error) {
    console.error("Failed to register asset:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not register asset" },
      { status: 500 }
    );
  }
}
