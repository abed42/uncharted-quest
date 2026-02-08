"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@repo/design-system/components/ui/breadcrumb";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { SquarePen } from "lucide-react";
import { useChatState } from "./chat-provider";

type DeckTitleEditorProps = {
  deckId: number;
  username: string;
  initialTitle: string;
};

export function DeckTitleEditor({
  deckId,
  username,
  initialTitle,
}: DeckTitleEditorProps) {
  const router = useRouter();
  const { deck, deckStatus, setActiveDeckId } = useChatState();
  const [title, setTitle] = useState(initialTitle);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const lastAutoAppliedTitleRef = useRef<string | null>(null);
  const dismissedSuggestionsRef = useRef<Set<string>>(new Set());

  const persistTitle = async (rawTitle: string, source: "manual" | "agent") => {
    const nextTitle = rawTitle.trim();
    if (!nextTitle || isSaving) {
      if (source === "manual") {
        setDraftTitle(title);
        setIsEditing(false);
      }
      return;
    }

    if (nextTitle === title) {
      if (source === "manual") {
        setIsEditing(false);
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: nextTitle }),
      });

      if (!response.ok) {
        throw new Error("Rename failed.");
      }

      const payload = (await response.json()) as { path: string; title: string };
      setTitle(payload.title);
      setDraftTitle(payload.title);
      setTitleSuggestion(null);
      if (source === "manual") {
        setIsEditing(false);
      } else {
        lastAutoAppliedTitleRef.current = payload.title;
      }
      router.replace(payload.path);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const save = async () => {
    await persistTitle(draftTitle, "manual");
  };

  useEffect(() => {
    setActiveDeckId(deckId);
    return () => {
      setActiveDeckId(null);
    };
  }, [deckId, setActiveDeckId]);

  useEffect(() => {
    if (deckStatus !== "ready" || !deck?.title) return;
    if (isEditing || isSaving) return;

    const currentTitle = title.trim();
    const aiTitle = deck.title.trim();
    if (!aiTitle || aiTitle === currentTitle) return;
    if (lastAutoAppliedTitleRef.current === aiTitle) return;
    if (dismissedSuggestionsRef.current.has(aiTitle)) return;
    if (titleSuggestion === aiTitle) return;

    setTitleSuggestion(aiTitle);
  }, [
    deck?.title,
    deckStatus,
    isEditing,
    isSaving,
    titleSuggestion,
    title,
  ]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="text-base sm:text-lg">
        <BreadcrumbItem>
          <BreadcrumbLink
            className="text-muted-foreground hover:text-foreground"
            href="/home"
          >
            @{username}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          {isEditing ? (
            <Input
              autoFocus
              className="h-9 min-w-44 max-w-sm"
              value={draftTitle}
              onBlur={() => {
                void save();
              }}
              onChange={(event) => setDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
                if (event.key === "Escape") {
                  setDraftTitle(title);
                  setIsEditing(false);
                }
              }}
            />
          ) : (
            <button
              aria-label="Edit deck title"
              className="text-foreground hover:text-foreground/80 inline-flex cursor-text items-center gap-2 font-medium"
              onClick={() => {
                setDraftTitle(title);
                setIsEditing(true);
              }}
              type="button"
            >
              <span>{title}</span>
              <SquarePen className="text-muted-foreground h-4 w-4" />
            </button>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
      {titleSuggestion ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Deck ready: {titleSuggestion}. Should this be your title?
          </span>
          <Button
            className="h-6 px-2 text-xs"
            disabled={isSaving}
            onClick={() => {
              void persistTitle(titleSuggestion!, "agent");
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Yes
          </Button>
          <Button
            className="h-6 px-2 text-xs"
            disabled={isSaving}
            onClick={() => {
              dismissedSuggestionsRef.current.add(titleSuggestion!);
              setTitleSuggestion(null);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            No
          </Button>
        </div>
      ) : null}
    </Breadcrumb>
  );
}
