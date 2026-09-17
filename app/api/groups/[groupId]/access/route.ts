import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, memberships } from "@/models";
import { getGroupMembership, isGroupCreator } from "@/lib/permissions";

interface AccessRequestBody {
  memberUserId?: string;
  assetId?: string;
  granted?: boolean; // true to grant, false to revoke
  action?: "grant" | "revoke" | "toggle";
}

// PATCH /api/groups/[groupId]/access - Creator-only endpoint to toggle/grant/revoke a member's assetAccess
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId } = await params;
  if (!groupId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId parameter" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  // 1. Enforce creator-only authorization
  const isCreator = await isGroupCreator(currentUserId, groupId);
  if (!isCreator) {
    return NextResponse.json(
      {
        error:
          "Forbidden: Only the group creator can manage asset access permissions",
      },
      { status: 403 }
    );
  }

  // 2. Parse and validate request body
  let body: AccessRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const { memberUserId, assetId, granted, action } = body;

  if (!memberUserId || typeof memberUserId !== "string") {
    return NextResponse.json(
      { error: "Validation Error: memberUserId is required" },
      { status: 400 }
    );
  }

  if (!assetId || typeof assetId !== "string") {
    return NextResponse.json(
      { error: "Validation Error: assetId is required" },
      { status: 400 }
    );
  }

  try {
    // 3. Verify asset exists in this group and is not deleted
    const [asset] = await db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.id, assetId),
          eq(assets.groupId, groupId),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);

    if (!asset) {
      return NextResponse.json(
        { error: "Not Found: Asset does not exist in this study group" },
        { status: 404 }
      );
    }

    // 4. Verify target member belongs to this group
    const targetMembership = await getGroupMembership(memberUserId, groupId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: "Not Found: Target user is not a member of this study group" },
        { status: 404 }
      );
    }

    // 5. Determine whether to grant or revoke
    const currentAccess = new Set(targetMembership.assetAccess || []);
    let shouldGrant: boolean;

    if (typeof granted === "boolean") {
      shouldGrant = granted;
    } else if (action === "grant") {
      shouldGrant = true;
    } else if (action === "revoke") {
      shouldGrant = false;
    } else {
      // Default: toggle
      shouldGrant = !currentAccess.has(assetId);
    }

    if (shouldGrant) {
      currentAccess.add(assetId);
    } else {
      currentAccess.delete(assetId);
    }

    const updatedAccessList = Array.from(currentAccess);

    // 6. Persist updated assetAccess array
    await db
      .update(memberships)
      .set({
        assetAccess: updatedAccessList,
      })
      .where(
        and(
          eq(memberships.groupId, groupId),
          eq(memberships.userId, memberUserId)
        )
      );

    return NextResponse.json(
      {
        message: shouldGrant
          ? "Asset access granted successfully"
          : "Asset access revoked successfully",
        memberUserId,
        assetId,
        granted: shouldGrant,
        assetAccess: updatedAccessList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update asset access:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not update asset access" },
      { status: 500 }
    );
  }
}
