import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { setDeckVisibility } from "@/lib/decks-store";

const payloadSchema = z.object({
  isPublic: z.boolean(),
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

  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid visibility payload." }, { status: 400 });
  }

  const deck = await setDeckVisibility({
    id,
    ownerId: userId,
    isPublic: parsed.data.isPublic,
  });

  if (!deck) {
    return NextResponse.json({ message: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({
    deckId: deck.id,
    isPublic: deck.isPublic,
    updatedAt: deck.updatedAt,
  });
}
