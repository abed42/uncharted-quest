import { streamObject, type LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createTask, updateTask } from "@/lib/chat-task-runtime";

const SYSTEM_PROMPT = `You are a pitch-deck assistant.
If you need more info, respond with JSON:
{"type":"question","message":"<single direct question>"}
When you are ready to generate a deck, respond with JSON:
{"type":"deck","message":"<short summary>","deck":{"title":"<deck title>","subtitle":"<optional>","slides":[{"title":"...","content":"...","bullets":["..."],"children":[{"title":"...","content":"...","bullets":["..."]}]}]}}
The deck title must match the actual pitch topic in the slides.
If the user's topic is clear but title preference is unclear, choose a strong specific title.
If the topic itself is unclear or mixed, ask one direct clarifying question that includes title direction.
Use "children" to create vertical (downward) slides that expand on a topic.
Use "children" only when a slide has a clear drill-down.
Do not create children for every slide.
Use at most 2 parent slides with children, and usually 2-3 children each.
If output may be long, prefer a smaller but valid deck over invalid JSON.
Never use Markdown code fences.
Always return valid JSON and nothing else.`;

const MAX_CONTEXT_MESSAGES = 8;

const slideSchema: z.ZodType<{
  title: string;
  content?: string;
  bullets?: string[];
  children?: Array<{
    title: string;
    content?: string;
    bullets?: string[];
    children?: any[];
  }>;
}> = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  children: z.array(z.lazy(() => slideSchema)).optional(),
});

const responseSchema = z.object({
  type: z.enum(["question", "deck"]),
  message: z.string().min(1),
  deck: z
    .object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      slides: z.array(slideSchema).default([]),
    })
    .optional(),
});

function buildContextMessages(input: unknown): any[] {
  if (!Array.isArray(input)) return [];
  return input.slice(-MAX_CONTEXT_MESSAGES);
}

export async function POST(request: Request) {
  const { messages } = await request.json();
  // Bridge ai@3 core typings with @ai-sdk/openai@1 provider typings in this repo.
  const model = openai("gpt-4o") as unknown as LanguageModelV1;
  const contextMessages = buildContextMessages(messages);
  const totalChars = Array.isArray(messages)
    ? messages.reduce((sum, message) => {
        if (typeof message?.content === "string") {
          return sum + message.content.length;
        }
        return sum;
      }, 0)
    : 0;
  const task = createTask({
    messageCount: Array.isArray(messages) ? messages.length : 0,
    totalChars,
  });
  updateTask(task.id, { status: "generating" });

  try {
    const result = await streamObject({
      model,
      system: SYSTEM_PROMPT,
      messages: contextMessages as any,
      schema: responseSchema,
      mode: "json",
      temperature: 0.4,
      maxTokens: 1800,
      onFinish: ({ error }) => {
        updateTask(task.id, { status: "finalizing" });
        if (error) {
          updateTask(task.id, {
            status: "failed",
            error: error instanceof Error ? error.message : "Generation failed.",
          });
        } else {
          updateTask(task.id, { status: "completed" });
        }

        console.info("[api/chat] completed", {
          taskId: task.id,
          inputMessages: Array.isArray(messages) ? messages.length : 0,
          contextMessages: contextMessages.length,
          totalChars,
          hasError: Boolean(error),
        });
      },
    });

    return result.toTextStreamResponse({
      headers: {
        "x-chat-task-id": task.id,
      },
    });
  } catch (error) {
    updateTask(task.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "Request failed.",
    });
    throw error;
  }
}
