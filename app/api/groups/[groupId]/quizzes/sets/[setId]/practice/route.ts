import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizQuestionSets,
  quizQuestions,
  quizAttempts,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ groupId: string; setId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return authResult.response;
  }

  const { groupId, setId } = await params;
  if (!groupId || !setId) {
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

    const [set] = await db
      .select()
      .from(quizQuestionSets)
      .where(
        and(
          eq(quizQuestionSets.id, setId),
          eq(quizQuestionSets.groupId, groupId),
          isNull(quizQuestionSets.deletedAt)
        )
      )
      .limit(1);

    if (!set) {
      return NextResponse.json(
        { error: "Not Found: Question set not found" },
        { status: 404 }
      );
    }

    if (set.status !== "published" && set.creatorId !== currentUserId) {
      return NextResponse.json(
        { error: "Not Found: Question set is not published" },
        { status: 404 }
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
      .where(eq(quizQuestions.setId, setId))
      .orderBy(asc(quizQuestions.orderNum));

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Question set has no questions" },
        { status: 400 }
      );
    }

    // Create a new practice attempt (contestId is NULL; repeatable unlimited times)
    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        userId: currentUserId,
        contestId: null,
        setId,
        mode: "practice",
      })
      .returning({
        id: quizAttempts.id,
        mode: quizAttempts.mode,
        startedAt: quizAttempts.startedAt,
      });

    return NextResponse.json(
      {
        attempt,
        set: {
          id: set.id,
          title: set.title,
          description: set.description,
        },
        questions,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to start practice attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to start practice session" },
      { status: 500 }
    );
  }
}
