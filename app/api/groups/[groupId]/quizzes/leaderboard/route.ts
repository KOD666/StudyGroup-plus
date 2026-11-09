import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, asc, isNotNull, sql, gte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizAttempts,
  quizContests,
  users,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function GET(
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
      { error: "Bad Request: Missing groupId" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  try {
    const membership = await getGroupMembership(currentUserId, groupId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: Not a member of this study lounge" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") === "week" ? "week" : "all";

    // Build conditions:
    // Only contest mode attempts belonging to this group's contests, submitted
    const conditions = [
      eq(quizContests.groupId, groupId),
      eq(quizAttempts.mode, "contest"),
      isNotNull(quizAttempts.submittedAt),
    ];

    if (range === "week") {
      // Start of current week (Monday 00:00:00 UTC)
      const now = new Date();
      const day = now.getUTCDay();
      const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0));
      conditions.push(gte(quizAttempts.startedAt, startOfWeek));
    }

    const rawStandings = await db
      .select({
        userId: quizAttempts.userId,
        userName: users.name,
        userAvatar: users.avatarUrl,
        totalPoints: sql<number>`sum(${quizAttempts.score})::int`,
        totalSeconds: sql<number>`sum(${quizAttempts.totalSeconds})::int`,
        contestsPlayed: sql<number>`count(${quizAttempts.id})::int`,
      })
      .from(quizAttempts)
      .innerJoin(quizContests, eq(quizAttempts.contestId, quizContests.id))
      .leftJoin(users, eq(quizAttempts.userId, users.id))
      .where(and(...conditions))
      .groupBy(quizAttempts.userId, users.name, users.avatarUrl)
      .orderBy(
        desc(sql`sum(${quizAttempts.score})`),
        asc(sql`sum(${quizAttempts.totalSeconds})`)
      );

    const standings = rawStandings.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      userName: row.userName || "Student",
      userAvatar: row.userAvatar,
      totalPoints: row.totalPoints ?? 0,
      totalSeconds: row.totalSeconds ?? 0,
      contestsPlayed: row.contestsPlayed ?? 0,
      isCurrentUser: row.userId === currentUserId,
    }));

    return NextResponse.json({
      range,
      standings,
    });
  } catch (error) {
    console.error("Failed to load lounge leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to load lounge leaderboard" },
      { status: 500 }
    );
  }
}
