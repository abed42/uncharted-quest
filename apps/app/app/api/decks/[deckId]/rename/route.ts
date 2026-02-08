import { auth } from "@repo/auth/server";
import { NextResponse } from "next/server";
import { renameDeck } from "@/lib/decks-store";

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

  const body = (await request.json()) as { title?: string };
  const title = body.title?.trim() ?? "";
  if (!title) {
    return NextResponse.json({ message: "Missing title." }, { status: 400 });
  }

  const deck = await renameDeck({
    id,
    ownerId: userId,
    title,
  });

  if (!deck) {
    return NextResponse.json({ message: "Deck not found." }, { status: 404 });
  }

  return NextResponse.json({
    deckId: deck.id,
    title: deck.title,
    slug: deck.slug,
    username: deck.username,
    path: `/${deck.username}/${deck.slug}`,
  });
}
