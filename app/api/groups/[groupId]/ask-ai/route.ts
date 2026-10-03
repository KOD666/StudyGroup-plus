import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { isGroupMember } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/ratelimit";
import { streamGroqCompletion, ChatMessagePayload } from "@/lib/groq";

// Maximum duration for Vercel Serverless Function
export const maxDuration = 30;

const MAX_INPUT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 1024;
const MAX_HISTORY_MESSAGES = 10;

interface AskAiRequestBody {
  messages?: ChatMessagePayload[];
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
      { error: "Bad Request: Missing groupId parameter" },
      { status: 400 }
    );
  }

  const currentUserId = authResult.context.userId;

  // 1. Rate limiting check (20 requests per minute per user)
  const rateLimitResult = checkRateLimit(`ask_ai:${currentUserId}`, {
    windowMs: 60 * 1000,
    maxRequests: 20,
  });
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error:
          "You have asked several questions recently. Please wait a moment before asking again.",
      },
      { status: 429 }
    );
  }

  // 2. Lounge membership verification
  const isMember = await isGroupMember(currentUserId, groupId);
  if (!isMember) {
    return NextResponse.json(
      { error: "Forbidden: You are not a member of this study group" },
      { status: 403 }
    );
  }

  let body: AskAiRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Bad Request: Invalid JSON body" },
      { status: 400 }
    );
  }

  const rawMessages = body.messages;
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json(
      { error: "Validation Error: messages array is required" },
      { status: 400 }
    );
  }

  // Cap history to recent messages
  const slicedMessages = rawMessages.slice(-MAX_HISTORY_MESSAGES);
  const validatedMessages: ChatMessagePayload[] = [];

  for (const m of slicedMessages) {
    if (
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string"
    ) {
      const content = m.content.trim().slice(0, MAX_INPUT_CHARS);
      if (content) {
        validatedMessages.push({ role: m.role, content });
      }
    }
  }

  if (validatedMessages.length === 0) {
    return NextResponse.json(
      { error: "Validation Error: At least one user message is required" },
      { status: 400 }
    );
  }

  try {
    const groqRes = await streamGroqCompletion(
      validatedMessages,
      MAX_OUTPUT_TOKENS
    );

    if (groqRes.status === 429) {
      return NextResponse.json(
        {
          error:
            "The study assistant is currently busy with high demand. Please try asking again in a few moments.",
        },
        { status: 429 }
      );
    }

    if (!groqRes.ok) {
      console.warn("Groq API returned non-OK status:", groqRes.status);
      return NextResponse.json(
        {
          error:
            "The study assistant encountered a temporary service hiccup. Please try again shortly.",
        },
        { status: 502 }
      );
    }

    if (!groqRes.body) {
      return NextResponse.json(
        {
          error:
            "The study assistant returned an empty response. Please try again.",
        },
        { status: 502 }
      );
    }

    // Stream SSE text chunks directly to client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = groqRes.body.getReader();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") continue;

              if (trimmed.startsWith("data: ")) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch {
                  // Partial JSON chunk
                }
              }
            }
          }
          controller.close();
        } catch (streamErr) {
          console.error("Error streaming Groq response:", streamErr);
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    if (errorObj?.message === "GROQ_API_KEY_MISSING") {
      return NextResponse.json(
        {
          error:
            "The AI study assistant is currently being configured by the administrator.",
        },
        { status: 503 }
      );
    }

    console.error("Failed to call Groq API:", err);
    return NextResponse.json(
      {
        error:
          "The study assistant encountered an unexpected issue. Please try your question again.",
      },
      { status: 500 }
    );
  }
}
