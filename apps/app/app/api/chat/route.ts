import { streamObject, type LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { auth } from "@repo/auth/server";
import { createTask, updateTask } from "@/lib/chat-task-runtime";
import {
  DECK_BACKGROUND_OPTIONS,
  DECK_FONT_OPTIONS,
  getBackgroundOptionsPromptList,
  getFontOptionsPromptList,
} from "@/lib/deck-style-options";
import { getDeckByIdForOwner } from "@/lib/decks-store";

const SYSTEM_PROMPT = `You are a pitch-deck assistant.
If you need more info, respond with JSON:
{"type":"question","message":"<single direct question>"}
When you are ready to generate a deck, respond with JSON:
{"type":"deck","message":"<short summary>","deck":{"title":"<deck title>","subtitle":"<optional>","backgroundImage":"<optional background filename>","fontFamily":"<optional font family>","slides":[{"title":"...","content":"...","bullets":["..."],"children":[{"title":"...","content":"...","bullets":["..."]}]}]}}
The deck title must match the actual pitch topic in the slides.
If the user's topic is clear but title preference is unclear, choose a strong specific title.
If the topic itself is unclear or mixed, ask one direct clarifying question that includes title direction.
For style:
- Choose backgroundImage only from this list:
${getBackgroundOptionsPromptList()}
- Choose fontFamily only from this list:
${getFontOptionsPromptList()}
- Always choose both backgroundImage and fontFamily when returning type="deck".
- If the user asks for no background or a blank deck, choose a background that is effectively dark/minimal from the allowed list.
- If editing an existing deck and user did not ask to restyle, preserve existing backgroundImage/fontFamily.
Use "children" to create vertical (downward) slides that expand on a topic.
Use "children" only when a slide has a clear drill-down.
Prefer "children" when a parent slide introduces a section that naturally breaks into 2-3 focused sub-slides (for example: problem details, product deep dive, go-to-market steps, financial assumptions, risks).
If a slide would otherwise have too many bullets (more than 4) or mixed subtopics, convert those details into vertical children instead.
Do not create children for title, closing, or simple single-point slides.
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
      backgroundImage: z.enum(DECK_BACKGROUND_OPTIONS),
      fontFamily: z.enum(DECK_FONT_OPTIONS),
      slides: z.array(slideSchema).default([]),
    })
    .optional(),
});

function buildContextMessages(input: unknown): any[] {
  if (!Array.isArray(input)) return [];
  return input.slice(-MAX_CONTEXT_MESSAGES);
}

function buildDeckContextSystemPrompt(deck: Awaited<ReturnType<typeof getDeckByIdForOwner>>) {
  if (!deck) return "";

  const contextPayload = {
    title: deck.title,
    prompt: deck.prompt,
    backgroundImage: deck.backgroundImage ?? null,
    fontFamily: deck.fontFamily ?? null,
    content: deck.content ?? null,
  };

  return `\nYou are editing an existing deck/project. Keep continuity with this deck unless the user explicitly asks to pivot to a different product/topic.
Existing deck context (source of truth):
${JSON.stringify(contextPayload)}
Rules for edits:
- Treat user requests as modifications to this existing deck.
- Keep the core product/topic consistent with the existing deck.
- Do not replace the deck with a new unrelated concept unless user clearly asks for a pivot/rewrite.
- If user request could mean either "small edit" or "full pivot", ask a single clarifying question.`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { messages?: unknown; deckId?: unknown };
  const messages = body.messages;
  const rawDeckId = body.deckId;
  const maybeDeckId = Number.isFinite(Number(rawDeckId)) ? Number(rawDeckId) : null;
  const { userId } = await auth();
  const existingDeck =
    userId && maybeDeckId
      ? await getDeckByIdForOwner({ id: maybeDeckId, ownerId: userId })
      : null;
  const systemPrompt = `${SYSTEM_PROMPT}${buildDeckContextSystemPrompt(existingDeck)}`;
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
      system: systemPrompt,
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
