import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quizQuestionSets, quizQuestions } from "@/models";
import { getGroupMembership } from "@/lib/permissions";
import {
  MAX_QUESTIONS_PER_SET,
  validateQuestion,
  RawQuestionInput,
  QuestionValidationError,
} from "@/lib/quizzes";

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCsv(content: string): {
  questions: RawQuestionInput[];
  errors: QuestionValidationError[];
} {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      questions: [],
      errors: [{ message: "CSV file must contain a header row and at least one data row" }],
    };
  }

  // Parse header
  const headerLine = lines[0] ?? "";
  const header = parseCsvLine(headerLine).map((h) => h.toLowerCase());
  const promptIdx = header.indexOf("prompt");
  const correctIdx =
    header.indexOf("correctanswer") !== -1
      ? header.indexOf("correctanswer")
      : header.indexOf("correct_option");
  const explanationIdx = header.indexOf("explanation");

  if (promptIdx === -1 || correctIdx === -1) {
    return {
      questions: [],
      errors: [
        {
          message:
            "CSV header must contain 'prompt' and 'correctAnswer' (or 'correct_option')",
        },
      ],
    };
  }

  const optionIndices: number[] = [];
  // Find option columns (optionA, optionB, ... or option1, option2, ...)
  header.forEach((col, idx) => {
    if (
      col.startsWith("option") &&
      idx !== correctIdx &&
      idx !== promptIdx &&
      idx !== explanationIdx
    ) {
      optionIndices.push(idx);
    }
  });

  if (optionIndices.length < 2) {
    return {
      questions: [],
      errors: [{ message: "CSV header must contain at least 2 option columns (e.g. optionA, optionB)" }],
    };
  }

  const questions: RawQuestionInput[] = [];
  const errors: QuestionValidationError[] = [];

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const rawLine = lines[rowIdx] ?? "";
    const cols = parseCsvLine(rawLine);
    const prompt = cols[promptIdx] || "";
    const rawCorrect = (cols[correctIdx] || "").trim().toUpperCase();
    const explanation = explanationIdx !== -1 ? cols[explanationIdx] || "" : "";

    const options: string[] = [];
    for (const optIdx of optionIndices) {
      const val = cols[optIdx];
      if (val !== undefined && val.trim()) {
        options.push(val.trim());
      }
    }

    // Parse correct answer: letter ('A'..'F') or number ('0'..'5' or '1'..'6')
    let correctOption = -1;
    if (/^[A-F]$/.test(rawCorrect)) {
      correctOption = rawCorrect.charCodeAt(0) - 65;
    } else if (/^\d+$/.test(rawCorrect)) {
      const num = parseInt(rawCorrect, 10);
      // Support 1-based (1..options.length) or 0-based
      correctOption = num >= 1 && num <= options.length ? num - 1 : num;
    }

    const questionInput: RawQuestionInput = {
      prompt,
      options,
      correctOption,
      explanation: explanation || null,
    };

    const err = validateQuestion(questionInput, rowIdx);
    if (err) {
      errors.push(err);
    } else {
      questions.push(questionInput);
    }
  }

  return { questions, errors };
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

    const contentType = req.headers.get("content-type") || "";
    let title = "Imported Question Set";
    let description: string | null = null;
    let questions: RawQuestionInput[] = [];
    const rowErrors: QuestionValidationError[] = [];

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { error: "Bad Request: Invalid JSON" },
          { status: 400 }
        );
      }
      title = body.title?.trim() || "Imported Question Set";
      description = body.description?.trim() || null;

      if (!Array.isArray(body.questions) || body.questions.length === 0) {
        return NextResponse.json(
          { error: "Validation Error: JSON must contain a non-empty 'questions' array" },
          { status: 400 }
        );
      }

      body.questions.forEach((q: RawQuestionInput, idx: number) => {
        const err = validateQuestion(q, idx);
        if (err) rowErrors.push(err);
        else questions.push(q);
      });
    } else {
      // Text or CSV payload
      const textContent = await req.text();
      const parsed = parseCsv(textContent);
      questions = parsed.questions;
      rowErrors.push(...parsed.errors);
    }

    // Atomic rejection: If any row is invalid, reject the whole import
    if (rowErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Import rejected: one or more rows are invalid. Correct all rows and re-upload.",
          rowErrors,
        },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No valid questions found to import" },
        { status: 400 }
      );
    }

    if (questions.length > MAX_QUESTIONS_PER_SET) {
      return NextResponse.json(
        { error: `Import exceeds limit of ${MAX_QUESTIONS_PER_SET} questions per set` },
        { status: 400 }
      );
    }

    // Insert set + questions
    const [newSet] = await db
      .insert(quizQuestionSets)
      .values({
        groupId,
        creatorId: currentUserId,
        title,
        description,
        source: "import",
        status: "published",
      })
      .returning();

    if (!newSet) {
      return NextResponse.json(
        { error: "Failed to create imported question set record" },
        { status: 500 }
      );
    }

    const questionInserts = questions.map((q, idx) => ({
      setId: newSet.id,
      orderNum: idx + 1,
      prompt: q.prompt.trim(),
      options: q.options.map((opt) => opt.trim()),
      correctOption: q.correctOption,
      explanation: q.explanation?.trim() || null,
    }));

    await db.insert(quizQuestions).values(questionInserts);

    return NextResponse.json(
      {
        set: newSet,
        importedCount: questions.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to bulk import quiz questions:", error);
    return NextResponse.json(
      { error: "Internal Server Error: Failed to import question set" },
      { status: 500 }
    );
  }
}
