import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicRevealPanel } from "@/components/public-reveal-panel";
import { getDeckByPath } from "@/lib/decks-store";

type PublicDeckPageProps = {
  params: Promise<{
    username: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicDeckPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Shared deck: ${slug}`,
    description: "Shared pitch deck",
  };
}

export default async function PublicDeckPage({ params }: PublicDeckPageProps) {
  const { username, slug } = await params;
  const deck = await getDeckByPath({ username, slug });

  if (!deck || !deck.isPublic) {
    notFound();
  }

  const slides = deck.content?.slides?.length
    ? deck.content.slides
    : [
        {
          title: deck.title || "Untitled",
          content: deck.prompt || "No deck content available yet.",
        },
      ];

  return (
    <main className="flex min-h-svh flex-col gap-4 p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link className="hover:text-foreground" href="/">
          uncharted.quest
        </Link>
        <span>
          @{deck.username}/{deck.slug}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <PublicRevealPanel
          backgroundImage={deck.backgroundImage}
          className="h-full"
          fontFamily={deck.fontFamily}
          slides={slides}
        />
      </div>
    </main>
  );
}
