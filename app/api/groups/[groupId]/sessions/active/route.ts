import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/models";
import { isGroupMember } from "@/lib/permissions";

// GET /api/groups/[groupId]/sessions/active - Query currently active live session
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
    // 1. Permission check: Caller must be a member of the group
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    // 2. Query for session with endedAt is null
    const [activeSession] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.groupId, groupId), isNull(sessions.endedAt)))
      .orderBy(desc(sessions.startedAt))
      .limit(1);

    if (!activeSession) {
      return NextResponse.json(
        { active: false, session: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        active: true,
        session: activeSession,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to check active session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not check active session" },
      { status: 500 }
    );
  }
}
