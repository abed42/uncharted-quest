"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useChat, type Message } from "ai/react";

export type DeckSlide = {
  id: string;
  title: string;
  content?: string;
  bullets?: string[];
  children?: DeckSlide[];
};

export type Deck = {
  id: string;
  title: string;
  subtitle?: string;
  slides: DeckSlide[];
};

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  deck: Deck | null;
  setDeck: (deck: Deck | null) => void;
};

const ChatContext = createContext<ChatState | null>(null);

const initialMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "What do you want to pitch?",
};

type ParsedSlide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: ParsedSlide[];
};

type ParsedPayload = {
  message?: string;
  deck?: {
    title: string;
    subtitle?: string;
    slides?: ParsedSlide[];
  };
};

function parsePayload(text: string): ParsedPayload | null {
  try {
    const parsed = JSON.parse(text) as ParsedPayload;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeSlide(slide: ParsedSlide): DeckSlide {
  return {
    id: crypto.randomUUID(),
    title: slide.title,
    content: slide.content,
    bullets: slide.bullets,
    children: slide.children?.map(normalizeSlide),
  };
}

function normalizeDeck(payload: NonNullable<ParsedPayload["deck"]>): Deck {
  return {
    id: crypto.randomUUID(),
    title: payload.title,
    subtitle: payload.subtitle,
    slides: (payload.slides ?? []).map(normalizeSlide),
  };
}

export function getDisplayText(content: string): string {
  const parsed = parsePayload(content);
  if (parsed?.message) return parsed.message;
  return content;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const chat = useChat({
    api: "/api/chat",
    initialMessages: [initialMessage],
    onFinish: (message) => {
      const parsed = parsePayload(message.content);
      if (parsed?.deck?.title) {
        setDeck(normalizeDeck(parsed.deck));
      }
    },
  });

  const value = useMemo<ChatState>(
    () => ({
      messages: chat.messages,
      input: chat.input,
      isLoading: chat.isLoading,
      handleInputChange: chat.handleInputChange,
      handleSubmit: chat.handleSubmit,
      stop: chat.stop,
      deck,
      setDeck,
    }),
    [
      chat.messages,
      chat.input,
      chat.isLoading,
      chat.handleInputChange,
      chat.handleSubmit,
      chat.stop,
      deck,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatState() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatProvider.");
  }
  return context;
}
