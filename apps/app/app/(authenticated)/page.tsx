import { auth, currentUser } from "@repo/auth/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DecksHome } from "./components/decks-home";
import { listDecksForOwner, slugify } from "@/lib/decks-store";

export const metadata: Metadata = {
  title: "Decks",
  description: "Create and manage your deck workspace",
};

function resolveUsername(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  const maybeUsername =
    (user as unknown as { username?: string }).username ??
    user.emailAddresses.at(0)?.emailAddress?.split("@")[0] ??
    user.fullName ??
    user.id;

  return slugify(maybeUsername);
}

const App = async () => {
  const [user, authState] = await Promise.all([currentUser(), auth()]);

  if (!user || !authState.userId) {
    notFound();
  }

  const username = resolveUsername(user);
  const decks = await listDecksForOwner(authState.userId);

  return (
    <DecksHome
      decks={decks.map((deck) => ({
        id: deck.id,
        title: deck.title,
        slug: deck.slug,
        updatedAt: deck.updatedAt,
      }))}
      username={username}
    />
  );
};

export default App;
