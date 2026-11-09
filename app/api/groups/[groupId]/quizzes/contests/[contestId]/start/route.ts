import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizContests,
  quizQuestions,
  quizAttempts,
  quizAnswers,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function POST(
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

    if (now < startTime) {
      return NextResponse.json(
        {
          error: `Contest has not started yet. Window opens at ${startTime.toLocaleTimeString()}.`,
        },
        { status: 400 }
      );
    }

    if (now >= deadline) {
      return NextResponse.json(
        { error: "Contest window has already closed." },
        { status: 400 }
      );
    }

    // Check if user already has an attempt
    const [existingAttempt] = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.contestId, contestId),
          eq(quizAttempts.userId, currentUserId)
        )
      )
      .limit(1);

    if (existingAttempt) {
      if (existingAttempt.submittedAt) {
        return NextResponse.json(
          {
            error:
              "You have already completed this contest. Only one attempt is permitted per participant.",
            attemptId: existingAttempt.id,
            alreadySubmitted: true,
          },
          { status: 409 }
        );
      }

      // Resume in-progress attempt: load questions and previously saved answers
      const questions = await db
        .select({
          id: quizQuestions.id,
          orderNum: quizQuestions.orderNum,
          prompt: quizQuestions.prompt,
          options: quizQuestions.options,
        })
        .from(quizQuestions)
        .where(eq(quizQuestions.setId, contest.setId))
        .orderBy(asc(quizQuestions.orderNum));

      const savedAnswers = await db
        .select({
          questionId: quizAnswers.questionId,
          chosenOption: quizAnswers.chosenOption,
        })
        .from(quizAnswers)
        .where(eq(quizAnswers.attemptId, existingAttempt.id));

      const answerMap: Record<string, number> = {};
      savedAnswers.forEach((a) => {
        answerMap[a.questionId] = a.chosenOption;
      });

      return NextResponse.json({
        attempt: {
          id: existingAttempt.id,
          startedAt: existingAttempt.startedAt,
          deadline: deadline.toISOString(),
        },
        contest: {
          id: contest.id,
          title: contest.title,
          deadline: deadline.toISOString(),
        },
        questions,
        savedAnswers: answerMap,
        resumed: true,
      });
    }

    // Create new attempt
    let newAttempt;
    try {
      const [created] = await db
        .insert(quizAttempts)
        .values({
          userId: currentUserId,
          contestId: contest.id,
          setId: contest.setId,
          mode: "contest",
          startedAt: now,
        })
        .returning();
      newAttempt = created;
    } catch (insertErr: unknown) {
      // Catch unique index violation in case of simultaneous requests
      if (
        insertErr &&
        typeof insertErr === "object" &&
        "code" in insertErr &&
        insertErr.code === "23505"
      ) {
        return NextResponse.json(
          {
            error:
              "You have already joined this contest. Only one attempt is allowed.",
          },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    if (!newAttempt) {
      return NextResponse.json(
        { error: "Failed to initialize contest attempt" },
        { status: 500 }
      );
    }

    // STRICT PRIVACY: Retrieve questions WITHOUT correctOption or explanation!
    const questions = await db
      .select({
        id: quizQuestions.id,
        orderNum: quizQuestions.orderNum,
        prompt: quizQuestions.prompt,
        options: quizQuestions.options,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.setId, contest.setId))
      .orderBy(asc(quizQuestions.orderNum));

    return NextResponse.json(
      {
        attempt: {
          id: newAttempt.id,
          startedAt: newAttempt.startedAt,
          deadline: deadline.toISOString(),
        },
        contest: {
          id: contest.id,
          title: contest.title,
          deadline: deadline.toISOString(),
        },
        questions,
        savedAnswers: {},
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start contest attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to enter contest" },
      { status: 500 }
    );
  }
}
