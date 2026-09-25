import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, groups } from "@/models";
import { isGroupMember } from "@/lib/permissions";

// POST /api/groups/[groupId]/sessions/start - Idempotently start or join an active live meeting session
export async function POST(
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

    // 2. Verify group exists and is active
    const [group] = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    // 3. Idempotently check if an active session already exists for this group
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.groupId, groupId), isNull(sessions.endedAt)))
      .orderBy(desc(sessions.startedAt))
      .limit(1);

    if (existingSession) {
      return NextResponse.json(
        {
          session: existingSession,
          isNew: false,
          message: "Joined existing active session",
        },
        { status: 200 }
      );
    }

    // 4. Create new active session with endedAt = null
    const [newSession] = await db
      .insert(sessions)
      .values({
        groupId,
        roomName: groupId,
        startedAt: new Date(),
        endedAt: null,
      })
      .returning();

    return NextResponse.json(
      {
        session: newSession,
        isNew: true,
        message: "Active session started",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start active session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not start active session" },
      { status: 500 }
    );
  }
}
