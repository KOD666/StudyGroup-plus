import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { memberships } from "@/models";
import { getGroupMembership, isGroupCreator } from "@/lib/permissions";

// DELETE /api/groups/[groupId]/members/[memberUserId] - Remove a member or leave group
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberUserId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, memberUserId } = await params;
  if (!groupId || !memberUserId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId or memberUserId parameter" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    // 1. Verify target membership exists
    const targetMembership = await getGroupMembership(memberUserId, groupId);
    if (!targetMembership) {
      return NextResponse.json(
        { error: "Not Found: Member is not in this study group" },
        { status: 404 }
      );
    }

    const isSelf = currentUserId === memberUserId;
    const isCallerCreator = await isGroupCreator(currentUserId, groupId);

    // 2. Permission check: caller must be self or group creator
    if (!isSelf && !isCallerCreator) {
      return NextResponse.json(
        { error: "Forbidden: Only group creators can remove other members" },
        { status: 403 }
      );
    }

    // 3. Creator self-leave check
    if (isSelf && isCallerCreator) {
      return NextResponse.json(
        {
          error:
            "Bad Request: Group creators cannot leave the group. Delete the group instead.",
        },
        { status: 400 }
      );
    }

    // 4. Delete membership (hard delete per Gate DB decision)
    await db
      .delete(memberships)
      .where(
        and(
          eq(memberships.groupId, groupId),
          eq(memberships.userId, memberUserId)
        )
      );

    return NextResponse.json(
      {
        message: isSelf
          ? "You have left the study group"
          : "Member removed from group successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to remove member:", error);
    return NextResponse.json(
      {
        error:
          "Internal Server Error: Could not remove member from study group",
      },
      { status: 500 }
    );
  }
}
