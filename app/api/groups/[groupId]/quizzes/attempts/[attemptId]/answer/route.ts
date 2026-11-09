import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizAttempts, quizAnswers, quizContests } from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function POST(
  req: NextRequest,
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
        { error: "Forbidden: You cannot modify another user's attempt" },
        { status: 403 }
      );
    }

    if (attempt.submittedAt) {
      return NextResponse.json(
        { error: "Bad Request: Attempt has already been submitted" },
        { status: 400 }
      );
    }

    // If this is a contest attempt, verify the contest window has not expired
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
        if (new Date() > deadline) {
          return NextResponse.json(
            { error: "Contest deadline has passed. Late answers cannot be accepted." },
            { status: 400 }
          );
        }
      }
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    const { questionId, chosenOption } = body;
    if (!questionId || typeof questionId !== "string") {
      return NextResponse.json(
        { error: "Validation Error: questionId is required" },
        { status: 400 }
      );
    }

    if (
      typeof chosenOption !== "number" ||
      chosenOption < 0 ||
      chosenOption > 5 ||
      !Number.isInteger(chosenOption)
    ) {
      return NextResponse.json(
        { error: "Validation Error: chosenOption must be an integer between 0 and 5" },
        { status: 400 }
      );
    }

    // Upsert answer
    await db
      .insert(quizAnswers)
      .values({
        attemptId,
        questionId,
        chosenOption,
        savedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [quizAnswers.attemptId, quizAnswers.questionId],
        set: {
          chosenOption,
          savedAt: sql`NOW()`,
        },
      });

    return NextResponse.json({ success: true, questionId, chosenOption });
  } catch (error) {
    console.error("Failed to autosave quiz answer:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to save answer" },
      { status: 500 }
    );
  }
}
