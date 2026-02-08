import { auth, currentUser } from "@repo/auth/server";
import { NextResponse } from "next/server";
import { createDeck, slugify } from "@/lib/decks-store";

function getUsername(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const maybeUsername =
    (user as unknown as { username?: string }).username ??
    user.emailAddresses.at(0)?.emailAddress?.split("@")[0] ??
    user.fullName ??
    user.id;

  return slugify(maybeUsername);
}

export async function POST(request: Request) {
  const user = await currentUser();
  const { userId } = await auth();

  if (!user || !userId) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim() ?? "";

  const username = getUsername(user);
  const deck = await createDeck({
    ownerId: userId,
    username,
    prompt,
  });

  return NextResponse.json({
    deckId: deck.id,
    username,
    slug: deck.slug,
    path: `/${username}/${deck.slug}`,
  });
}
