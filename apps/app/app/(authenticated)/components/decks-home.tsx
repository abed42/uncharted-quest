"use client";

import { ArrowUpRightIcon, PlusIcon } from "lucide-react";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/design-system/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@repo/design-system/components/ui/empty";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";

type DeckCard = {
  id: number;
  title: string;
  slug: string;
  updatedAt: string;
};

type DecksHomeProps = {
  username: string;
  decks: DeckCard[];
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DecksHome({ username, decks }: DecksHomeProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createDeck = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const response = await fetch("/api/decks/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to start deck.");
      }

      const payload = (await response.json()) as { path: string };
      router.push(payload.path);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative flex flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "url('/BG-desktop.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className={`${poppins.className} relative z-20 px-2 pt-4 text-xl font-bold tracking-tight text-white sm:px-4`}
      >
        uncharted.quest
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="space-y-3 pt-6 text-center">
          <Badge variant="outline">Decks</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Build your next story in one prompt.
          </h1>
        </header>

        <Card className="mx-auto w-full max-w-3xl">
          <CardContent className="pt-6">
            <InputGroup>
              <InputGroupInput
              placeholder="Describe the deck you want to generate..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createDeck();
                }
              }}
            />
            <InputGroupButton
              className="mr-1"
              disabled={isCreating}
              onClick={() => void createDeck()}
              size="sm"
              variant="default"
            >
              {isCreating ? "Creating..." : "Create"}
            </InputGroupButton>
            </InputGroup>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Started Decks</h2>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button
              className="bg-card text-card-foreground hover:bg-accent flex min-h-[170px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition"
              onClick={() => void createDeck()}
              type="button"
            >
              <div className="rounded-full border p-3">
                <PlusIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">New deck</p>
            </button>

            {decks.length === 0 ? (
              <Empty className="min-h-[170px] border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PlusIcon />
                  </EmptyMedia>
                  <EmptyTitle>No decks yet</EmptyTitle>
                  <EmptyDescription>
                    Start with the prompt above or use the new deck tile.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent />
              </Empty>
            ) : null}

            {decks.map((deck) => (
              <Link
                className="group"
                href={`/${username}/${deck.slug}`}
                key={deck.id}
              >
                <Card className="min-h-[170px] justify-between transition-colors group-hover:bg-accent/60">
                  <CardHeader className="pb-2">
                    <p className="text-muted-foreground text-xs">
                      @{username}/{deck.slug}
                    </p>
                    <CardTitle className="line-clamp-2 text-lg">{deck.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Updated {formatDate(deck.updatedAt)}</span>
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
