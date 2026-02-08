import { auth } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotificationsProvider } from "@/app/(authenticated)/components/notifications-provider";
import { ChatProvider } from "@/app/(authenticated)/components/chat-provider";
import { GlobalSidebar } from "@/app/(authenticated)/components/sidebar";
import { DeckTitleEditor } from "@/app/(authenticated)/components/deck-title-editor";
import { ArtifactPanel } from "@/app/(authenticated)/presentations/components/artifact-panel";
import { PublicRevealPanel } from "@/components/public-reveal-panel";
import { getDeckByPath } from "@/lib/decks-store";

type DeckRoutePageProps = {
  params: Promise<{
    username: string;
    slug: string;
  }>;
  searchParams: Promise<{
    present?: string;
  }>;
};

export async function generateMetadata({
  params,
}: DeckRoutePageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: slug,
    description: "Deck workspace",
  };
}

function resolveSlides(deck: NonNullable<Awaited<ReturnType<typeof getDeckByPath>>>) {
  return deck.content?.slides?.length
    ? deck.content.slides
    : [
        {
          title: deck.title || "Untitled",
          content: deck.prompt || "Start chatting to generate slides.",
        },
      ];
}

export default async function DeckRoutePage({
  params,
  searchParams,
}: DeckRoutePageProps) {
  const { username, slug } = await params;
  const { present } = await searchParams;
  const deck = await getDeckByPath({ username, slug });

  if (!deck) {
    notFound();
  }

  const { userId } = await auth();
  const isOwner = Boolean(userId && deck.ownerId === userId);
  const isPresentMode = present === "1";
  const slides = resolveSlides(deck);

  if (!isOwner) {
    if (!deck.isPublic) {
      notFound();
    }

    return (
      <main className="flex min-h-svh flex-col p-0">
        <PublicRevealPanel
          backgroundImage={deck.backgroundImage}
          className="h-svh rounded-none border-0"
          fontFamily={deck.fontFamily}
          slides={slides}
        />
      </main>
    );
  }

  if (isPresentMode) {
    return (
      <main className="flex min-h-svh flex-col p-0">
        <PublicRevealPanel
          backgroundImage={deck.backgroundImage}
          className="h-svh rounded-none border-0"
          fontFamily={deck.fontFamily}
          slides={slides}
        />
      </main>
    );
  }

  return (
    <NotificationsProvider userId={userId!}>
      <ChatProvider>
        <SidebarProvider style={{ "--sidebar-width": "27rem" } as CSSProperties}>
          <GlobalSidebar>
            <main className="flex min-h-svh flex-col gap-4 p-4">
              <DeckTitleEditor
                deckId={deck.id}
                initialTitle={deck.title}
                initialSlug={deck.slug}
                initialIsPublic={deck.isPublic}
                username={deck.username}
                initialChatHistory={deck.chatHistory}
                initialDeckContent={deck.content}
              />

              <div className="min-h-0 flex-1">
                <ArtifactPanel
                  backgroundImage={deck.backgroundImage}
                  className="h-full"
                  demoSlides={slides}
                  fontFamily={deck.fontFamily}
                />
              </div>
            </main>
          </GlobalSidebar>
        </SidebarProvider>
      </ChatProvider>
    </NotificationsProvider>
  );
}
