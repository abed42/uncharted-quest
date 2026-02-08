import { NextResponse } from "next/server";
import { PITCH_DECK_SKILL } from "./prompt-skills/pitch-deck-skill";
import { REVEAL_JS_SKILL } from "./prompt-skills/revealjs-skill";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

type Attachment = {
  name: string;
  type: string;
  dataUrl: string;
};

type DeckSlide = {
  id: string;
  title: string;
  content?: string;
  bullets?: string[];
  children?: DeckSlide[];
};

type Deck = {
  id: string;
  title: string;
  subtitle?: string;
  theme: {
    name: "maia";
    accent: "subtle";
    radius: "large";
  };
  slides: DeckSlide[];
};

const SYSTEM_PROMPT = `
You are a pitch-deck agent. Decide if you have enough info to build a deck.
If not enough info, ask a single, direct question that unlocks progress.
You must ask for: project name (if missing), CTA (if missing), and logo (if missing).
If logo is missing, ask if they can upload one. If they say no, proceed without it.
When you generate a deck, output a concise, audience-appropriate slide set.
Keep the slide count minimal and based on available information.
Decide when to use vertical slides with "children":
- Use children only when a slide has a clear drill-down (e.g. roadmap phases, step-by-step process, pricing tiers, or technical architecture layers).
- Prefer flat slides for independent topics.
- Do not create children for every slide.
- Use at most 2 parent slides with children in a deck unless the user explicitly asks for a deep hierarchy.
- Each parent should usually have 2-3 children.
If you have a deck already, prefer tool calls to edit it rather than generating from scratch.
When asking a question, set deck to null.
When returning a deck, include deck.id, deck.title, deck.subtitle, deck.theme, and slides with id/title/content/bullets and optional children.

${PITCH_DECK_SKILL}

${REVEAL_JS_SKILL}
`;

const responseSchema = {
  name: "pitch_deck_response",
  schema: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["question", "deck", "tool_result"] },
      message: { type: "string" },
      deck: {
        type: ["object", "null"],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          subtitle: { type: "string" },
          theme: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              accent: { type: "string" },
              radius: { type: "string" },
            },
            required: ["name", "accent", "radius"],
          },
          slides: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
                bullets: {
                  type: "array",
                  items: { type: "string" },
                },
                children: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      title: { type: "string" },
                      content: { type: "string" },
                      bullets: {
                        type: "array",
                        items: { type: "string" },
                      },
                    },
                    required: ["id", "title", "content", "bullets"],
                  },
                },
              },
              required: ["id", "title", "content", "bullets"],
            },
          },
        },
        required: ["id", "title", "subtitle", "theme", "slides"],
      },
    },
    required: ["type", "message", "deck"],
    additionalProperties: false,
  },
};

const TOOL_DEFINITIONS = [
  {
    type: "function",
    name: "insert_slide",
    description: "Insert a new slide at a position.",
    parameters: {
      type: "object",
      properties: {
        index: { type: "number" },
        slide: {
          type: "object",
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            bullets: { type: "array", items: { type: "string" } },
            children: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  content: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                },
                required: ["id", "title"],
              },
            },
          },
          required: ["id", "title"],
        },
      },
      required: ["index", "slide"],
    },
  },
  {
    type: "function",
    name: "update_slide",
    description: "Update slide content.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        children: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
              bullets: { type: "array", items: { type: "string" } },
            },
            required: ["id", "title"],
          },
        },
      },
      required: ["id"],
    },
  },
  {
    type: "function",
    name: "delete_slide",
    description: "Delete a slide by id.",
    parameters: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    type: "function",
    name: "reorder_slides",
    description: "Reorder slides by ids.",
    parameters: {
      type: "object",
      properties: {
        order: { type: "array", items: { type: "string" } },
      },
      required: ["order"],
    },
  },
  {
    type: "function",
    name: "set_deck_meta",
    description: "Update deck title/subtitle.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
      },
      required: [],
    },
  },
];

function applyToolCalls(deck: Deck, toolCalls: any[]) {
  const next: Deck = {
    ...deck,
    slides: deck.slides.map((slide) => ({
      ...slide,
      children: slide.children?.map((child) => ({ ...child })),
    })),
  };

  for (const call of toolCalls) {
    const name = call.name;
    const args = call.arguments ?? {};

    if (name === "insert_slide") {
      const index = Math.max(
        0,
        Math.min(next.slides.length, args.index ?? next.slides.length)
      );
      next.slides.splice(index, 0, normalizeSlide(args.slide));
    }

    if (name === "update_slide") {
      const target = next.slides.find((slide) => slide.id === args.id);
      if (target) {
        if (typeof args.title === "string") target.title = args.title;
        if (typeof args.content === "string") target.content = args.content;
        if (Array.isArray(args.bullets)) target.bullets = args.bullets;
        if (Array.isArray(args.children)) {
          target.children = args.children.map((child: any) =>
            normalizeSlide(child)
          );
        }
      }
    }

    if (name === "delete_slide") {
      next.slides = next.slides.filter((slide) => slide.id !== args.id);
    }

    if (name === "reorder_slides") {
      const order = Array.isArray(args.order) ? args.order : [];
      const map = new Map<string, DeckSlide>(
        next.slides.map((slide) => [slide.id, slide])
      );
      const reordered = order.map((id: string) => map.get(id)).filter(Boolean);
      const remaining = next.slides.filter((slide) => !order.includes(slide.id));
      next.slides = [...(reordered as DeckSlide[]), ...remaining];
    }

    if (name === "set_deck_meta") {
      if (typeof args.title === "string") next.title = args.title;
      if (typeof args.subtitle === "string") next.subtitle = args.subtitle;
    }
  }

  return next;
}

function normalizeSlide(slide: any): DeckSlide {
  return {
    id: slide?.id ?? crypto.randomUUID(),
    title: slide?.title ?? "",
    content: slide?.content ?? "",
    bullets: Array.isArray(slide?.bullets) ? slide.bullets : [],
    children: Array.isArray(slide?.children)
      ? slide.children.map((child: any) => normalizeSlide(child))
      : undefined,
  };
}

function normalizeDeck(deck: any): Deck {
  return {
    id: deck?.id ?? crypto.randomUUID(),
    title: deck?.title ?? "Pitch Deck",
    subtitle: deck?.subtitle ?? "",
    theme: deck?.theme ?? {
      name: "maia",
      accent: "subtle",
      radius: "large",
    },
    slides: Array.isArray(deck?.slides)
      ? deck.slides.map((slide: any) => normalizeSlide(slide))
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = (body.messages ?? []) as IncomingMessage[];
    const attachments = (body.attachments ?? []) as Attachment[];
    const existingDeck = (body.deck ?? null) as Deck | null;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { type: "question", message: "Missing OPENAI_API_KEY.", deck: null },
        { status: 500 }
      );
    }

    const input = messages.map((message, index) => {
      const isLastUser =
        index === messages.length - 1 && message.role === "user";

      const attachmentNote =
        isLastUser && attachments.length > 0
          ? `\n\nAttachments provided: ${attachments
              .map((file) => file.name)
              .join(", ")}`
          : "";

      return {
        type: "message",
        role: message.role,
        content: `${message.content}${attachmentNote}`,
      };
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        existingDeck
          ? {
              model: "gpt-4o",
              instructions: SYSTEM_PROMPT,
              input,
              temperature: 0.4,
              max_output_tokens: 900,
              tools: TOOL_DEFINITIONS,
              tool_choice: "auto",
            }
          : {
              model: "gpt-4o",
              instructions: SYSTEM_PROMPT,
              input,
              temperature: 0.4,
              max_output_tokens: 900,
              tools: TOOL_DEFINITIONS,
              tool_choice: "none",
              text: {
                format: {
                  type: "json_schema",
                  name: responseSchema.name,
                  schema: responseSchema.schema,
                },
              },
            }
      ),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          type: "question",
          message: data?.error?.message ?? "Agent error.",
          deck: null,
        },
        { status: 500 }
      );
    }

    if (data.output?.some((item: any) => item.type === "tool_call")) {
      const toolCalls = data.output
        .filter((item: any) => item.type === "tool_call")
        .map((item: any) => ({
          name: item.name,
          arguments: item.arguments ? JSON.parse(item.arguments) : {},
        }));

      if (!existingDeck) {
        return NextResponse.json({
          type: "question",
          message: "I need a deck before I can apply edits.",
          deck: null,
        });
      }

      const updatedDeck = applyToolCalls(existingDeck, toolCalls);
      return NextResponse.json({
        type: "tool_result",
        message: "Updated the deck.",
        deck: updatedDeck,
      });
    }

    const parsedFromResponse =
      data?.output_parsed ??
      data?.output?.[0]?.content?.[0]?.parsed ??
      null;

    if (parsedFromResponse) {
      const normalized = parsedFromResponse;
      if (normalized.type === "question") {
        normalized.deck = null;
      } else if (normalized.type === "deck" && normalized.deck) {
        normalized.deck = normalizeDeck(normalized.deck);
      }
      if (typeof normalized.message !== "string") {
        normalized.message =
          normalized.type === "question"
            ? "Tell me more."
            : "Here is your deck.";
      }
      return NextResponse.json(normalized);
    }

    const raw =
      data?.output_text ??
      data?.output?.[0]?.content
        ?.map((item: { text?: string }) => item.text ?? "")
        .join("") ??
      data?.output?.[0]?.content?.[0]?.text ??
      "";

    if (!raw) {
      return NextResponse.json({
        type: "question",
        message: "I didn’t get a response. Can you rephrase?",
        deck: null,
      });
    }

    const parsed = JSON.parse(raw);
    if (parsed.type === "deck") {
      parsed.deck = normalizeDeck(parsed.deck);
    }
    if (parsed.type === "question") {
      parsed.deck = null;
    }
    if (typeof parsed.message !== "string") {
      parsed.message =
        parsed.type === "question" ? "Tell me more." : "Here is your deck.";
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        type: "question",
        message: error instanceof Error ? error.message : "Agent error.",
        deck: null,
      },
      { status: 500 }
    );
  }
}
