import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledSessions } from "@/models";
import { isGroupCreator } from "@/lib/permissions";

// PATCH /api/groups/[groupId]/schedule/[sessionId] - Owner can edit scheduled session
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; sessionId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, sessionId } = await params;
  if (!groupId || !sessionId) {
    return NextResponse.json(
      { error: "Bad Request: Missing parameters" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    const isOwner = await isGroupCreator(currentUserId, groupId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the lounge owner can edit a scheduled session" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updateData: Partial<{
      title: string;
      description: string | null;
      scheduledAt: Date;
      status: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Validation Error: Title cannot be empty" },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }

    if (body.scheduledAt !== undefined) {
      const scheduledDate = new Date(body.scheduledAt);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          { error: "Validation Error: Invalid date format" },
          { status: 400 }
        );
      }
      if (scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Validation Error: Cannot schedule a session in the past" },
          { status: 400 }
        );
      }
      updateData.scheduledAt = scheduledDate;
    }

    if (body.status !== undefined) {
      if (!["scheduled", "cancelled", "completed"].includes(body.status)) {
        return NextResponse.json(
          { error: "Validation Error: Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    const [updated] = await db
      .update(scheduledSessions)
      .set(updateData)
      .where(
        and(
          eq(scheduledSessions.id, sessionId),
          eq(scheduledSessions.groupId, groupId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Not Found: Scheduled session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: updated }, { status: 200 });
  } catch (error) {
    console.error("Failed to update scheduled session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not update session" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[groupId]/schedule/[sessionId] - Owner can cancel a scheduled session
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; sessionId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, sessionId } = await params;
  if (!groupId || !sessionId) {
    return NextResponse.json(
      { error: "Bad Request: Missing parameters" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    const isOwner = await isGroupCreator(currentUserId, groupId);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the lounge owner can cancel a scheduled session" },
        { status: 403 }
      );
    }

    const [cancelled] = await db
      .update(scheduledSessions)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(
        and(
          eq(scheduledSessions.id, sessionId),
          eq(scheduledSessions.groupId, groupId)
        )
      )
      .returning();

    if (!cancelled) {
      return NextResponse.json(
        { error: "Not Found: Scheduled session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Session cancelled successfully", session: cancelled },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to cancel scheduled session:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not cancel session" },
      { status: 500 }
    );
  }
}
