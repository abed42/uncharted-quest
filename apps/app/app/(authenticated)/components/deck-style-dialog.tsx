"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import {
  DECK_BACKGROUND_OPTIONS,
  DECK_FONT_OPTIONS,
  getDeckBackgroundPublicPath,
} from "@/lib/deck-style-options";
import { useChatState } from "./chat-provider";

type DeckStyleDialogProps = {
  deckId: number;
};

export function DeckStyleDialog({ deckId }: DeckStyleDialogProps) {
  const { deck, activeDeckId, setDeck } = useChatState();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>("");
  const [selectedFont, setSelectedFont] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBackground(deck?.backgroundImage ?? "");
    setSelectedFont(deck?.fontFamily ?? "");
  }, [deck?.backgroundImage, deck?.fontFamily, isOpen]);

  const applyStyle = async () => {
    if (!deck || isSaving) return;

    const targetDeckId = activeDeckId ?? deckId;
    if (!targetDeckId) return;

    setBackgroundError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${targetDeckId}/content`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: deck.title,
          subtitle: deck.subtitle,
          backgroundImage: selectedBackground || deck.backgroundImage,
          fontFamily: selectedFont || deck.fontFamily,
          slides: deck.slides.map((slide) => ({
            title: slide.title,
            content: slide.content,
            bullets: slide.bullets,
            children: slide.children?.map((child) => ({
              title: child.title,
              content: child.content,
              bullets: child.bullets,
            })),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to apply style.");
      }

      setDeck({
        ...deck,
        backgroundImage: selectedBackground || deck.backgroundImage,
        fontFamily: selectedFont || deck.fontFamily,
      });
      setIsOpen(false);
    } catch {
      setBackgroundError("Could not save style. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          Style
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Deck style</DialogTitle>
          <DialogDescription>
            Pick a background and font for this deck.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Background</p>
            <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
              {DECK_BACKGROUND_OPTIONS.map((backgroundName) => {
                const previewPath = getDeckBackgroundPublicPath(backgroundName);
                const isSelected = selectedBackground === backgroundName;

                return (
                  <button
                    aria-label={`Select background ${backgroundName}`}
                    className={cn(
                      "group relative aspect-video overflow-hidden rounded-lg border bg-muted transition",
                      isSelected
                        ? "border-primary ring-2 ring-primary/60"
                        : "border-border hover:border-primary/60"
                    )}
                    disabled={!deck || isSaving}
                    key={backgroundName}
                    onClick={() => setSelectedBackground(backgroundName)}
                    title={backgroundName}
                    type="button"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url('${previewPath ?? ""}')` }}
                    />
                    <div className="absolute inset-0 bg-black/15 opacity-0 transition group-hover:opacity-100" />
                    <span className="sr-only">{backgroundName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Font</p>
            <select
              className="bg-background h-9 w-full rounded-md border border-border px-3 text-sm"
              disabled={!deck || isSaving}
              onChange={(event) => setSelectedFont(event.target.value)}
              value={selectedFont}
            >
              <option value="">Select font</option>
              {DECK_FONT_OPTIONS.map((fontName) => (
                <option key={fontName} value={fontName}>
                  {fontName}
                </option>
              ))}
            </select>
            {selectedFont ? (
              <div className="rounded-md border border-border bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">{selectedFont}</p>
                <p className="text-sm text-foreground" style={{ fontFamily: `${selectedFont}, serif` }}>
                  Aa Bb Cc - The deck tells a sharper story.
                </p>
              </div>
            ) : null}
          </div>

          {backgroundError ? (
            <p className="text-xs text-destructive">{backgroundError}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button disabled={isSaving} onClick={() => setIsOpen(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={!deck || isSaving} onClick={() => void applyStyle()} type="button">
            {isSaving ? "Saving..." : "Apply style"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
