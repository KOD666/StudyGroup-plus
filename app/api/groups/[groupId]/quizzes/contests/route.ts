import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizContests,
  quizQuestionSets,
  quizQuestions,
  quizAttempts,
  users,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";
import { notifyContestCreated } from "@/lib/notifications";

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

    const contests = await db
      .select({
        id: quizContests.id,
        groupId: quizContests.groupId,
        setId: quizContests.setId,
        creatorId: quizContests.creatorId,
        title: quizContests.title,
        startTime: quizContests.startTime,
        durationMinutes: quizContests.durationMinutes,
        createdAt: quizContests.createdAt,
        setTitle: quizQuestionSets.title,
        creatorName: users.name,
        creatorAvatar: users.avatarUrl,
        questionCount: sql<number>`(
          SELECT count(*)::int FROM ${quizQuestions}
          WHERE ${quizQuestions.setId} = ${quizContests.setId}
        )`,
        participantCount: sql<number>`(
          SELECT count(*)::int FROM ${quizAttempts}
          WHERE ${quizAttempts.contestId} = ${quizContests.id}
        )`,
      })
      .from(quizContests)
      .innerJoin(quizQuestionSets, eq(quizContests.setId, quizQuestionSets.id))
      .leftJoin(users, eq(quizContests.creatorId, users.id))
      .where(eq(quizContests.groupId, groupId))
      .orderBy(desc(quizContests.startTime));

    // Also get caller's attempts for each contest
    const userAttempts = await db
      .select({
        id: quizAttempts.id,
        contestId: quizAttempts.contestId,
        score: quizAttempts.score,
        totalSeconds: quizAttempts.totalSeconds,
        startedAt: quizAttempts.startedAt,
        submittedAt: quizAttempts.submittedAt,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, currentUserId),
          eq(quizAttempts.mode, "contest")
        )
      );

    const userAttemptMap = new Map(
      userAttempts.map((a) => [a.contestId, a])
    );

    const enriched = contests.map((c) => ({
      ...c,
      userAttempt: userAttemptMap.get(c.id) || null,
    }));

    return NextResponse.json({ contests: enriched });
  } catch (error) {
    console.error("Failed to list quiz contests:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to list contests" },
      { status: 500 }
    );
  }
}

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

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    const { setId, title, startTime, durationMinutes } = body;

    if (!setId || typeof setId !== "string") {
      return NextResponse.json(
        { error: "Validation Error: setId is required" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Validation Error: Contest title is required" },
        { status: 400 }
      );
    }

    if (!startTime || typeof startTime !== "string") {
      return NextResponse.json(
        { error: "Validation Error: startTime is required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Validation Error: Invalid startTime format" },
        { status: 400 }
      );
    }

    // Must not be in the past (allow 1 minute grace for client clock skew)
    if (startDate.getTime() < Date.now() - 60000) {
      return NextResponse.json(
        { error: "Validation Error: Contest start time cannot be in the past" },
        { status: 400 }
      );
    }

    const duration = parseInt(durationMinutes, 10);
    if (isNaN(duration) || duration < 5 || duration > 180) {
      return NextResponse.json(
        { error: "Validation Error: durationMinutes must be between 5 and 180 minutes" },
        { status: 400 }
      );
    }

    // Verify set exists and is published in this group
    const [set] = await db
      .select()
      .from(quizQuestionSets)
      .where(
        and(
          eq(quizQuestionSets.id, setId),
          eq(quizQuestionSets.groupId, groupId)
        )
      )
      .limit(1);

    if (!set) {
      return NextResponse.json(
        { error: "Not Found: Question set not found in this lounge" },
        { status: 404 }
      );
    }

    if (set.status !== "published") {
      return NextResponse.json(
        { error: "Validation Error: Only published question sets can be used for contests" },
        { status: 400 }
      );
    }

    // Create contest
    const [newContest] = await db
      .insert(quizContests)
      .values({
        groupId,
        setId,
        creatorId: currentUserId,
        title: title.trim(),
        startTime: startDate,
        durationMinutes: duration,
      })
      .returning();

    if (!newContest) {
      return NextResponse.json(
        { error: "Failed to schedule contest record" },
        { status: 500 }
      );
    }

    // Trigger notification to lounge members
    await notifyContestCreated({
      groupId,
      contestId: newContest.id,
      title: newContest.title,
      creatorUserId: currentUserId,
      startTime: startDate,
    });

    return NextResponse.json({ contest: newContest }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contest:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to schedule contest" },
      { status: 500 }
    );
  }
}
