"use client";

import { useEffect, useRef } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { Separator } from "@repo/design-system/components/ui/separator";
import { cn } from "@repo/design-system/lib/utils";
import { getDisplayText, useChatState } from "./chat-provider";

type AgentChatProps = {
  className?: string;
};

export function AgentChat({ className }: AgentChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    deck,
  } = useChatState();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  const canSend = input.trim().length > 0 && !isLoading;

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
            {deck ? (
              <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                Deck ready: {deck.title}
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
