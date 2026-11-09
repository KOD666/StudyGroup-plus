import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, asc, isNotNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizContests,
  quizAttempts,
  quizQuestions,
  users,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; contestId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, contestId } = await params;
  if (!groupId || !contestId) {
    return NextResponse.json(
      { error: "Bad Request: Missing parameters" },
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

    const [contest] = await db
      .select()
      .from(quizContests)
      .where(
        and(
          eq(quizContests.id, contestId),
          eq(quizContests.groupId, groupId)
        )
      )
      .limit(1);

    if (!contest) {
      return NextResponse.json(
        { error: "Not Found: Contest not found in this lounge" },
        { status: 404 }
      );
    }

    const now = new Date();
    const startTime = new Date(contest.startTime);
    const deadline = new Date(
      startTime.getTime() + contest.durationMinutes * 60 * 1000
    );
    const windowClosed = now >= deadline;

    // Fetch submitted attempts ordered by score DESC, totalSeconds ASC, submittedAt ASC
    const rawLeaderboard = await db
      .select({
        attemptId: quizAttempts.id,
        userId: quizAttempts.userId,
        userName: users.name,
        userAvatar: users.avatarUrl,
        score: quizAttempts.score,
        totalSeconds: quizAttempts.totalSeconds,
        submittedAt: quizAttempts.submittedAt,
      })
      .from(quizAttempts)
      .leftJoin(users, eq(quizAttempts.userId, users.id))
      .where(
        and(
          eq(quizAttempts.contestId, contestId),
          isNotNull(quizAttempts.submittedAt)
        )
      )
      .orderBy(
        desc(quizAttempts.score),
        asc(quizAttempts.totalSeconds),
        asc(quizAttempts.submittedAt)
      );

    // Assign standard competition ranks (1, 2, 3...)
    const leaderboard = rawLeaderboard.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      userName: item.userName || "Participant",
      userAvatar: item.userAvatar,
      score: item.score ?? 0,
      totalSeconds: item.totalSeconds ?? 0,
      submittedAt: item.submittedAt,
      isCurrentUser: item.userId === currentUserId,
    }));

    // If window closed, reveal correct answers & explanations to everyone
    let explanations = null;
    if (windowClosed) {
      explanations = await db
        .select({
          id: quizQuestions.id,
          orderNum: quizQuestions.orderNum,
          prompt: quizQuestions.prompt,
          options: quizQuestions.options,
          correctOption: quizQuestions.correctOption,
          explanation: quizQuestions.explanation,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.setId, contest.setId))
        .orderBy(asc(quizQuestions.orderNum));
    }

    return NextResponse.json({
      contest: {
        id: contest.id,
        title: contest.title,
        startTime: contest.startTime,
        durationMinutes: contest.durationMinutes,
        deadline: deadline.toISOString(),
      },
      windowClosed,
      leaderboard,
      explanations,
    });
  } catch (error) {
    console.error("Failed to load contest leaderboard:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to load leaderboard" },
      { status: 500 }
    );
  }
}
