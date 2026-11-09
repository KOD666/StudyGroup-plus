import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quizQuestionSets,
  quizQuestions,
  users,
} from "@/models";
import { getGroupMembership } from "@/lib/permissions";
import {
  MAX_QUESTIONS_PER_SET,
  validateQuestion,
  RawQuestionInput,
} from "@/lib/quizzes";

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

    // Members see all published sets in this lounge + draft sets they created
    const sets = await db
      .select({
        id: quizQuestionSets.id,
        groupId: quizQuestionSets.groupId,
        creatorId: quizQuestionSets.creatorId,
        title: quizQuestionSets.title,
        description: quizQuestionSets.description,
        source: quizQuestionSets.source,
        status: quizQuestionSets.status,
        createdAt: quizQuestionSets.createdAt,
        updatedAt: quizQuestionSets.updatedAt,
        creatorName: users.name,
        creatorAvatar: users.avatarUrl,
        questionCount: sql<number>`(
          SELECT count(*)::int FROM ${quizQuestions}
          WHERE ${quizQuestions.setId} = ${quizQuestionSets.id}
        )`,
      })
      .from(quizQuestionSets)
      .leftJoin(users, eq(quizQuestionSets.creatorId, users.id))
      .where(
        and(
          eq(quizQuestionSets.groupId, groupId),
          isNull(quizQuestionSets.deletedAt),
          or(
            eq(quizQuestionSets.status, "published"),
            eq(quizQuestionSets.creatorId, currentUserId)
          )
        )
      )
      .orderBy(desc(quizQuestionSets.createdAt));

    return NextResponse.json({ sets });
  } catch (error) {
    console.error("Failed to list quiz question sets:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to list question sets" },
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
        { error: "Bad Request: Invalid JSON payload" },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      source = "manual",
      status = "published",
      questions,
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Validation Error: Title is required" },
        { status: 400 }
      );
    }

    if (title.trim().length > 255) {
      return NextResponse.json(
        { error: "Validation Error: Title must be 255 characters or fewer" },
        { status: 400 }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Validation Error: Question set must have at least 1 question" },
        { status: 400 }
      );
    }

    if (questions.length > MAX_QUESTIONS_PER_SET) {
      return NextResponse.json(
        {
          error: `Validation Error: Question set cannot exceed ${MAX_QUESTIONS_PER_SET} questions`,
        },
        { status: 400 }
      );
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const err = validateQuestion(questions[i] as RawQuestionInput, i);
      if (err) {
        return NextResponse.json(
          { error: `Validation Error (Question ${err.row}): ${err.message}` },
          { status: 400 }
        );
      }
    }

    // Insert set
    const [newSet] = await db
      .insert(quizQuestionSets)
      .values({
        groupId,
        creatorId: currentUserId,
        title: title.trim(),
        description: description?.trim() || null,
        source: ["manual", "import", "ai"].includes(source) ? source : "manual",
        status: status === "draft" ? "draft" : "published",
      })
      .returning();

    if (!newSet) {
      return NextResponse.json(
        { error: "Failed to create question set record" },
        { status: 500 }
      );
    }

    // Insert questions
    const questionInserts = questions.map(
      (q: RawQuestionInput, index: number) => ({
        setId: newSet.id,
        orderNum: index + 1,
        prompt: q.prompt.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOption: q.correctOption,
        explanation: q.explanation?.trim() || null,
      })
    );

    await db.insert(quizQuestions).values(questionInserts);

    return NextResponse.json({ set: newSet, count: questions.length }, { status: 201 });
  } catch (error) {
    console.error("Failed to create quiz question set:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Unable to create question set" },
      { status: 500 }
    );
  }
}
