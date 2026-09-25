import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions } from "@/models";
import { isGroupMember } from "@/lib/permissions";

// POST /api/groups/[groupId]/sessions/[sessionId]/end - Mark an active session ended
export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ groupId: string; sessionId: string }>;
  }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, sessionId } = await params;
  if (!groupId || !sessionId) {
    return NextResponse.json(
      { error: "Bad Request: Missing groupId or sessionId parameter" },
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

    // 2. Update session endedAt if currently null
    const [updatedSession] = await db
      .update(sessions)
      .set({
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.groupId, groupId)
        )
      )
      .returning();

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Not Found: Meeting session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        session: updatedSession,
        message: "Session ended successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to end active session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not end active session" },
      { status: 500 }
    );
  }
}
