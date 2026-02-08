import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { saveDeckContent } from "@/lib/decks-store";
import { isDeckBackgroundOption, isDeckFontOption } from "@/lib/deck-style-options";

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

const contentSchema = z.object({
  message: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  backgroundImage: z.string().optional(),
  fontFamily: z.string().optional(),
  slides: z.array(slideSchema).default([]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ deckId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { deckId } = await context.params;
  const id = Number.parseInt(deckId, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "Invalid deck id." }, { status: 400 });
  }

  const parsed = contentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid content payload." }, { status: 400 });
  }

  const backgroundImage =
    parsed.data.backgroundImage && isDeckBackgroundOption(parsed.data.backgroundImage)
      ? parsed.data.backgroundImage
      : undefined;
  const fontFamily =
    parsed.data.fontFamily && isDeckFontOption(parsed.data.fontFamily)
      ? parsed.data.fontFamily
      : undefined;

  const deck = await saveDeckContent({
    id,
    ownerId: userId,
    content: parsed.data,
    backgroundImage,
    fontFamily,
  });

  if (!deck) {
    return NextResponse.json({ message: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({
    deckId: deck.id,
    updatedAt: deck.updatedAt,
  });
}
