import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, memberships, users } from "@/models";
import { getGroupMembership, isGroupCreator } from "@/lib/permissions";
import { isValidYouTubeUrl } from "@/lib/utils";

// GET /api/groups/[groupId] - Get details and member roster of a group
export async function GET(
  _req: NextRequest,
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

  try {
    // 1. Validate caller is an active group member
    const callerMembership = await getGroupMembership(currentUserId, groupId);
    if (!callerMembership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 2. Fetch group
    const [group] = await db
      .select()
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 3. Fetch members with user info
    const membersList = await db
      .select({
        membershipId: memberships.id,
        userId: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        role: memberships.role,
        assetAccess: memberships.assetAccess,
        joinedAt: memberships.joinedAt,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.groupId, groupId));

    return NextResponse.json(
      {
        group,
        callerRole: callerMembership.role,
        callerAssetAccess: callerMembership.assetAccess,
        members: membersList,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch group details:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch study group details" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId] - Soft-delete a group (creator-only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId } = await params;
  const currentUserId = authResult.context.userId;

  try {
    const isCreator = await isGroupCreator(currentUserId, groupId);
    if (!isCreator) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Only the group creator can delete this study group",
        },
        { status: 403 }
      );
    }

    await db
      .update(groups)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    return NextResponse.json(
      { message: "Study group deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete group:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not delete study group" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[groupId] - Update group settings (e.g. youtubeUrl) (creator-only)
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

  try {
    const isCreator = await isGroupCreator(currentUserId, groupId);
    if (!isCreator) {
      return NextResponse.json(
        {
          error: "Forbidden: Only the group creator can edit lounge settings",
        },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData: {
      updatedAt: Date;
      youtubeUrl?: string | null;
    } = {
      updatedAt: new Date(),
    };

    if ("youtubeUrl" in body) {
      const rawUrl = body.youtubeUrl;
      if (rawUrl === null || rawUrl === "" || rawUrl === undefined) {
        updateData.youtubeUrl = null;
      } else if (typeof rawUrl === "string") {
        const trimmed = rawUrl.trim();
        if (trimmed === "") {
          updateData.youtubeUrl = null;
        } else if (!isValidYouTubeUrl(trimmed)) {
          return NextResponse.json(
            {
              error:
                "Please enter a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)",
            },
            { status: 400 }
          );
        } else {
          updateData.youtubeUrl = trimmed;
        }
      } else {
        return NextResponse.json(
          { error: "Invalid youtubeUrl format: must be a string or null" },
          { status: 400 }
        );
      }
    }

    const [updatedGroup] = await db
      .update(groups)
      .set(updateData)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .returning();

    if (!updatedGroup) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        group: updatedGroup,
        message: "Lounge settings updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update group settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not update lounge settings" },
      { status: 500 }
    );
  }
}
