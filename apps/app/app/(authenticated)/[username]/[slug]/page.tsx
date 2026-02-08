import { auth } from "@repo/auth/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeckTitleEditor } from "../../components/deck-title-editor";
import { ArtifactPanel } from "../../presentations/components/artifact-panel";
import { getDeckByPath } from "@/lib/decks-store";

type DeckPageProps = {
  params: Promise<{
    username: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: DeckPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug,
    description: "Deck workspace",
  };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { userId } = await auth();
  if (!userId) {
    notFound();
  }

  const { username, slug } = await params;
  const deck = await getDeckByPath({ username, slug });

  if (!deck || deck.ownerId !== userId) {
    notFound();
  }

  const demoSlides = [
    ...(deck.content?.slides?.length
      ? deck.content.slides
      : [
          {
            title: deck.title || "Untitled",
            content: deck.prompt || "Start chatting to generate slides.",
          },
        ]),
  ];

  return (
    <main className="flex min-h-svh flex-col gap-4 p-4">
      <DeckTitleEditor
        deckId={deck.id}
        initialTitle={deck.title}
        username={deck.username}
      />

      <div className="min-h-0 flex-1">
        <ArtifactPanel className="h-full" demoSlides={demoSlides} />
      </div>
    </main>
  );
}
