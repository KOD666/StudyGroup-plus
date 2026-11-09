import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizAttempts,
  quizAnswers,
  quizQuestions,
  quizContests,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; attemptId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, attemptId } = await params;
  if (!groupId || !attemptId) {
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

    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      return NextResponse.json(
        { error: "Not Found: Attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.userId !== currentUserId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot submit another user's attempt" },
        { status: 403 }
      );
    }

    // If already submitted, return the existing result
    if (attempt.submittedAt && attempt.score !== null) {
      return NextResponse.json({
        attemptId: attempt.id,
        score: attempt.score,
        totalSeconds: attempt.totalSeconds,
        alreadySubmitted: true,
      });
    }

    let contestWindowEnded = false;
    let submittedAt = new Date();

    if (attempt.mode === "contest" && attempt.contestId) {
      const [contest] = await db
        .select()
        .from(quizContests)
        .where(eq(quizContests.id, attempt.contestId))
        .limit(1);

      if (contest) {
        const deadline = new Date(
          contest.startTime.getTime() + contest.durationMinutes * 60 * 1000
        );
        // Cap submittedAt at deadline if submitted at or after deadline
        if (submittedAt > deadline) {
          submittedAt = deadline;
          contestWindowEnded = true;
        }
      }
    }

    // 1. Fetch all questions for this set with real answers
    const questions = await db
      .select({
        id: quizQuestions.id,
        orderNum: quizQuestions.orderNum,
        prompt: quizQuestions.prompt,
        options: quizQuestions.options,
        correctOption: quizQuestions.correctOption,
        explanation: quizQuestions.explanation,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.setId, attempt.setId))
      .orderBy(asc(quizQuestions.orderNum));

    // 2. Fetch all saved answers for this attempt
    const answers = await db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.attemptId, attemptId));

    const answerMap = new Map(answers.map((a) => [a.questionId, a.chosenOption]));

    // 3. Score calculation
    let score = 0;
    const scoredQuestions = questions.map((q) => {
      const chosen = answerMap.get(q.id) ?? null;
      const isCorrect = chosen !== null && chosen === q.correctOption;
      if (isCorrect) score++;

      return {
        id: q.id,
        orderNum: q.orderNum,
        prompt: q.prompt,
        options: q.options,
        chosenOption: chosen,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const totalSeconds = Math.max(
      1,
      Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
    );

    // 4. Update attempt record
    await db
      .update(quizAttempts)
      .set({
        submittedAt,
        score,
        totalSeconds,
      })
      .where(eq(quizAttempts.id, attemptId));

    // 5. Response payload:
    // If practice: return correct answers and explanations immediately.
    // If contest: hide correct answers and explanations until the contest window has ended!
    if (attempt.mode === "practice" || contestWindowEnded) {
      return NextResponse.json({
        attemptId,
        mode: attempt.mode,
        score,
        totalQuestions: questions.length,
        totalSeconds,
        results: scoredQuestions,
      });
    }

    // Contest attempt while window is still active: Return taker's own score only!
    return NextResponse.json({
      attemptId,
      mode: attempt.mode,
      score,
      totalQuestions: questions.length,
      totalSeconds,
      message:
        "Score recorded. Full answers and explanations will be revealed once the contest window closes.",
    });
  } catch (error) {
    console.error("Failed to submit quiz attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to score attempt" },
      { status: 500 }
    );
  }
}
