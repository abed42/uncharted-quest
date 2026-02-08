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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { CheckIcon, CopyIcon, GlobeIcon, SquarePen } from "lucide-react";
import { useChatState } from "./chat-provider";

type InitialSlide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: InitialSlide[];
};

type DeckTitleEditorProps = {
  deckId: number;
  username: string;
  initialTitle: string;
  initialSlug: string;
  initialIsPublic: boolean;
  initialChatHistory?: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  initialDeckContent?: {
    title: string;
    subtitle?: string;
    slides: InitialSlide[];
  };
};

export function DeckTitleEditor({
  deckId,
  username,
  initialTitle,
  initialSlug,
  initialIsPublic,
  initialChatHistory,
  initialDeckContent,
}: DeckTitleEditorProps) {
  const router = useRouter();
  const { deck, deckStatus, activateDeck, deactivateDeck } = useChatState();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublishPopoverOpen, setIsPublishPopoverOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [titleSuggestion, setTitleSuggestion] = useState<string | null>(null);
  const lastAutoAppliedTitleRef = useRef<string | null>(null);
  const dismissedSuggestionsRef = useRef<Set<string>>(new Set());
  const activatedDeckRef = useRef<number | null>(null);

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

      const payload = (await response.json()) as {
        path: string;
        title: string;
        slug: string;
      };
      setTitle(payload.title);
      setSlug(payload.slug);
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

  const shareUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/${username}/${slug}`;

  const setVisibility = async (nextIsPublic: boolean) => {
    if (isPublishing) return false;
    setIsPublishing(true);
    try {
      const response = await fetch(`/api/decks/${deckId}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });

      if (!response.ok) {
        throw new Error("Publish update failed.");
      }

      setIsPublic(nextIsPublic);
      return true;
    } finally {
      setIsPublishing(false);
    }
  };

  const copyShareLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const openPresentMode = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("deck:present"));
  };

  const onPublishPopoverChange = (nextOpen: boolean) => {
    setIsPublishPopoverOpen(nextOpen);
    if (!nextOpen) return;
    if (isPublic) return;
    void setVisibility(true);
  };

  useEffect(() => {
    if (activatedDeckRef.current === deckId) return;
    activatedDeckRef.current = deckId;
    activateDeck({
      deckId,
      chatHistory: initialChatHistory,
      persistedDeck: initialDeckContent,
    });
    return () => {
      activatedDeckRef.current = null;
      deactivateDeck();
    };
  }, [activateDeck, deckId, deactivateDeck, initialChatHistory, initialDeckContent]);

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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
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
        </Breadcrumb>

        <div className="flex shrink-0 items-center gap-2">
          {/* <Button onClick={onExport} size="sm" type="button" variant="outline">
            Export
          </Button> */}
          <Button onClick={openPresentMode} size="sm" type="button" variant="outline">
            Present
          </Button>
          <Popover onOpenChange={onPublishPopoverChange} open={isPublishPopoverOpen}>
            <PopoverTrigger asChild>
              <Button disabled={isPublishing} size="sm" type="button">
                {isPublishing ? "Publishing..." : isPublic ? "Published" : "Publish"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 space-y-3 p-3">
              <div className="flex items-start gap-2">
                <GlobeIcon className="text-muted-foreground mt-0.5 h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Public share link</p>
                  <p className="text-muted-foreground text-xs">
                    Anyone with this link can view this deck.
                  </p>
                </div>
              </div>
              <div className="bg-muted flex items-center gap-1 rounded-md border p-1">
                <Input className="h-8 border-0 bg-transparent text-xs shadow-none" readOnly value={shareUrl} />
                <Button
                  aria-label="Copy share link"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    void copyShareLink();
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex justify-between">
                <Button
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    void copyShareLink();
                  }}
                  type="button"
                  variant="outline"
                >
                  Copy Link
                </Button>
                {isPublic ? (
                  <Button
                    className="h-7 px-2 text-xs"
                    disabled={isPublishing}
                    onClick={() => {
                      void setVisibility(false);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Unpublish
                  </Button>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

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
    </div>
  );
}
