import { NextResponse } from "next/server";
import { eq, and, gte, asc, inArray, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduledSessions, groups, memberships } from "@/models";

// GET /api/sessions/upcoming - Fetch upcoming scheduled sessions across all groups current user belongs to
export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const currentUserId = authResult.context.userId;

  try {
    // 1. Get user's active group memberships
    const userMemberships = await db
      .select({ groupId: memberships.groupId })
      .from(memberships)
      .innerJoin(groups, eq(memberships.groupId, groups.id))
      .where(and(eq(memberships.userId, currentUserId), isNull(groups.deletedAt)));

    if (userMemberships.length === 0) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const groupIds = userMemberships.map((m) => m.groupId);

    // 2. Fetch upcoming scheduled sessions
    const upcoming = await db
      .select({
        id: scheduledSessions.id,
        groupId: scheduledSessions.groupId,
        groupName: groups.name,
        groupCode: groups.code,
        title: scheduledSessions.title,
        description: scheduledSessions.description,
        scheduledAt: scheduledSessions.scheduledAt,
        status: scheduledSessions.status,
      })
      .from(scheduledSessions)
      .innerJoin(groups, eq(scheduledSessions.groupId, groups.id))
      .where(
        and(
          inArray(scheduledSessions.groupId, groupIds),
          eq(scheduledSessions.status, "scheduled"),
          gte(scheduledSessions.scheduledAt, new Date()),
          isNull(groups.deletedAt)
        )
      )
      .orderBy(asc(scheduledSessions.scheduledAt))
      .limit(10);

    return NextResponse.json({ sessions: upcoming }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch upcoming sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Could not fetch upcoming sessions" },
      { status: 500 }
    );
  }
}
