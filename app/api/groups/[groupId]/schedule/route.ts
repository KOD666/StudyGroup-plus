import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledSessions, groups } from "@/models";
import { isGroupCreator, isGroupMember } from "@/lib/permissions";
import { notifySessionScheduled } from "@/lib/notifications";

// GET /api/groups/[groupId]/schedule - Fetch active scheduled sessions for this group
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
    const isMember = await isGroupMember(currentUserId, groupId);
    if (!isMember) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this study group" },
        { status: 403 }
      );
    }

    const sessions = await db
      .select()
      .from(scheduledSessions)
      .where(
        and(
          eq(scheduledSessions.groupId, groupId),
          eq(scheduledSessions.status, "scheduled"),
          gte(scheduledSessions.scheduledAt, new Date())
        )
      )
      .orderBy(asc(scheduledSessions.scheduledAt));

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch scheduled sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch scheduled sessions" },
      { status: 500 }
    );
  }
}

// POST /api/groups/[groupId]/schedule - Schedule a meeting (owner only, UTC storage, rejects past times)
export async function POST(
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
    // Only group owner can schedule
    const isOwner = await isGroupCreator(currentUserId, groupId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the lounge owner can schedule a meeting" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, scheduledAt, description } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Validation Error: Title is required" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Validation Error: Scheduled date/time is required" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: "Validation Error: Invalid date format" },
        { status: 400 }
      );
    }

    // Reject times in the past on the server
    if (scheduledDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Validation Error: Cannot schedule a session in the past" },
        { status: 400 }
      );
    }

    // Verify group exists
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      return NextResponse.json(
        { error: "Not Found: Study group not found" },
        { status: 404 }
      );
    }

    const [newSession] = await db
      .insert(scheduledSessions)
      .values({
        groupId,
        creatorId: currentUserId,
        title: title.trim(),
        description: description ? description.trim() : null,
        scheduledAt: scheduledDate,
        status: "scheduled",
      })
      .returning();

    if (!newSession) {
      return NextResponse.json(
        { error: "Internal Server Error: Failed to create scheduled session" },
        { status: 500 }
      );
    }

    // Trigger notification to group members (Item 9)
    await notifySessionScheduled({
      groupId,
      sessionId: newSession.id,
      title: newSession.title,
      scheduledAt: newSession.scheduledAt,
      creatorUserId: currentUserId,
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Failed to schedule session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not schedule session" },
      { status: 500 }
    );
  }
}
