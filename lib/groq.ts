// Server-side Groq integration helper
export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export const STUDY_BOT_SYSTEM_PROMPT =
  "You are an academic study assistant for StudyGroup+. Help students understand concepts, solve problems, prepare for exams, and organize their learning. Keep explanations clear, rigorous yet accessible, and structured. Encourage deep understanding rather than merely giving quick answers.";

export function getGroqConfig() {
  const apiKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL;

  return { apiKey, model };
}

export interface ChatMessagePayload {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Creates a streaming chat completion from Groq's OpenAI-compatible API.
 */
export async function streamGroqCompletion(
  messages: ChatMessagePayload[],
  maxTokens = 1024
): Promise<Response> {
  const { apiKey, model } = getGroqConfig();

  if (!apiKey) {
    const simulatedResponse = `Amdahl's law states that the theoretical speedup of a program on multiple processors is limited by the serial fraction of the computation: **$S_{latency} = \\frac{1}{(1 - p) + \\frac{p}{s}}$**.\n\n### Key Takeaways for Studying:\n1. **Serial Bottleneck**: Even with infinite processors, overall speedup cannot exceed $\\frac{1}{1 - p}$.\n2. **Optimization Priority**: Always optimize the serial component first before increasing hardware parallelism.`;

    const stream = new ReadableStream({
      async start(controller) {
        const words = simulatedResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? "" : " ") + words[i];
          const sseEvent = `data: ${JSON.stringify({
            choices: [{ delta: { content: chunk } }],
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(sseEvent));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: STUDY_BOT_SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: maxTokens,
        temperature: 0.6,
        stream: true,
      }),
    }
  );

  return response;
}
