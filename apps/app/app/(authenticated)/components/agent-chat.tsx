"use client";

import { useEffect, useRef } from "react";
import { useMemo, useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { getDisplayText, useChatState } from "./chat-provider";

type AgentChatProps = {
  className?: string;
};

const loadingWords = [
  "pitch-decking",
  "noodling",
  "considering",
  "prepping",
  "putting things together",
];

function AnimatedDeckStatus() {
  const [wordIndex, setWordIndex] = useState(0);
  const word = useMemo(() => loadingWords[wordIndex] ?? loadingWords[0], [wordIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((current) => (current + 1) % loadingWords.length);
    }, 1400);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
      <span className="mr-1">Deck generation:</span>
      <span className="inline-block overflow-hidden align-middle">
        <span className="loading-word" key={word}>
          {word}
        </span>
      </span>
      <span className="ml-1">for your pitch...</span>
      <style jsx>{`
        .loading-word {
          position: relative;
          display: inline-block;
          color: hsl(var(--foreground));
          animation: slideIn 280ms ease-out;
        }

        .loading-word::after {
          content: "";
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.65) 50%,
            transparent 100%
          );
          transform: translateX(-130%);
          animation: shine 900ms ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes shine {
          to {
            transform: translateX(130%);
          }
        }
      `}</style>
    </div>
  );
}

export function AgentChat({ className }: AgentChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    deck,
    deckStatus,
    lastDeckError,
    taskStatus,
  } = useChatState();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const canSend = input.trim().length > 0 && !isLoading;
  const isGenerating = Boolean(taskStatus) || isLoading || deckStatus === "loading";
  const statusMessage =
    deckStatus === "question"
      ? "Need one more detail before building the deck."
      : deckStatus === "parse_failed"
        ? lastDeckError ?? "Could not parse deck output. Try a shorter prompt."
        : null;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="px-4 text-xs uppercase text-muted-foreground">
        Agent
      </div>
      <Separator className="my-3" />
      <ScrollArea className="flex-1 px-4">
        <div className="flex min-h-full flex-col pb-4">
          <div className="flex-1" />
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  message.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {getDisplayText(message.content)}
              </div>
            ))}
            {deck && deckStatus === "ready" ? (
              <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                Deck ready: {deck.title}
              </div>
            ) : null}
            {isGenerating ? (
              <AnimatedDeckStatus />
            ) : null}
            {!isGenerating && statusMessage ? (
              <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                {statusMessage}
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>
      <form className="border-t px-4 py-3" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="What do you want to pitch?"
            value={input}
            onChange={handleInputChange}
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" size="sm" disabled={!canSend}>
              {isLoading ? "Thinking..." : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
