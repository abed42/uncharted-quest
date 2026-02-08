"use client";

import {
  useCallback,
  createContext,
  useEffect,
  useContext,
  useMemo,
  useRef,
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

export type DeckStatus =
  | "idle"
  | "loading"
  | "ready"
  | "question"
  | "parse_failed";

type ChatState = {
  messages: Message[];
  input: string;
  isLoading: boolean;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  stop: () => void;
  deck: Deck | null;
  deckStatus: DeckStatus;
  lastDeckError: string | null;
  taskStatus: string | null;
  setDeck: (deck: Deck | null) => void;
  activeDeckId: number | null;
  activateDeck: (params: {
    deckId: number;
    chatHistory?: Array<{
      id: string;
      role: "user" | "assistant" | "system";
      content: string;
    }>;
    persistedDeck?: {
      title: string;
      subtitle?: string;
      slides: ParsedSlide[];
    };
  }) => void;
  deactivateDeck: () => void;
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
  type?: "question" | "deck";
  message?: string;
  deck?: {
    title: string;
    subtitle?: string;
    slides?: ParsedSlide[];
  };
};

function tryParsePayload(raw: string): ParsedPayload | null {
  try {
    const parsed = JSON.parse(raw) as ParsedPayload;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
}

function extractFirstJsonObject(text: string): string | null {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parsePayload(text: string): ParsedPayload | null {
  const direct = tryParsePayload(text);
  if (direct) return direct;

  const withoutFences = stripCodeFences(text);
  const cleaned = tryParsePayload(withoutFences);
  if (cleaned) return cleaned;

  const embedded = extractFirstJsonObject(withoutFences);
  if (!embedded) return null;

  return tryParsePayload(embedded);
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
  const [deckStatus, setDeckStatus] = useState<DeckStatus>("idle");
  const [lastDeckError, setLastDeckError] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [activeDeckId, setActiveDeckId] = useState<number | null>(null);
  const activeDeckIdRef = useRef<number | null>(null);
  const chatSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventsRef = useRef<EventSource | null>(null);
  const isSavingDeckRef = useRef(false);

  useEffect(() => {
    activeDeckIdRef.current = activeDeckId;
  }, [activeDeckId]);

  const clearChatSaveTimer = () => {
    if (!chatSaveTimerRef.current) return;
    clearTimeout(chatSaveTimerRef.current);
    chatSaveTimerRef.current = null;
  };

  const stopTaskStream = () => {
    eventsRef.current?.close();
    eventsRef.current = null;
  };

  const startTaskStream = (taskId: string) => {
    stopTaskStream();

    const events = new EventSource(`/api/chat/tasks/${taskId}/events`);
    eventsRef.current = events;

    events.addEventListener("status", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          status?: string;
          error?: string;
        };
        if (payload.status === "queued") {
          setTaskStatus("Queued...");
        } else if (payload.status === "generating") {
          setTaskStatus("Generating...");
        } else if (payload.status === "finalizing") {
          setTaskStatus("Finalizing response...");
        } else if (payload.status === "completed") {
          setTaskStatus(null);
          stopTaskStream();
        } else if (payload.status === "failed") {
          setTaskStatus(null);
          setDeckStatus("parse_failed");
          setLastDeckError(payload.error ?? "Task failed.");
          stopTaskStream();
        }
      } catch {
        // Ignore malformed event payloads.
      }
    });

    events.addEventListener("error", () => {
      setTaskStatus(null);
      stopTaskStream();
    });
  };

  useEffect(() => {
    return () => {
      stopTaskStream();
      clearChatSaveTimer();
    };
  }, []);

  const chat = useChat({
    api: "/api/chat",
    body: {
      deckId: activeDeckId,
    },
    streamProtocol: "text",
    initialMessages: [initialMessage],
    onResponse: (response) => {
      const taskId = response.headers.get("x-chat-task-id");
      setDeckStatus("loading");
      setLastDeckError(null);
      if (taskId) {
        startTaskStream(taskId);
      } else {
        setTaskStatus(null);
      }
    },
    onFinish: (message) => {
      stopTaskStream();
      setTaskStatus(null);
      const parsed = parsePayload(message.content);
      if (!parsed) {
        setDeckStatus("parse_failed");
        setLastDeckError(
          "I could not parse the final deck payload. Please retry with a shorter brief."
        );
        return;
      }

      if (parsed.type === "question") {
        setDeckStatus("question");
        return;
      }

      if (parsed?.deck?.title) {
        const normalizedDeck = normalizeDeck(parsed.deck);
        setDeck(normalizedDeck);
        setDeckStatus("ready");
        setLastDeckError(null);

        if (activeDeckIdRef.current && !isSavingDeckRef.current) {
          isSavingDeckRef.current = true;
          void fetch(`/api/decks/${activeDeckIdRef.current}/content`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: parsed.message,
              title: parsed.deck.title,
              subtitle: parsed.deck.subtitle,
              slides: parsed.deck.slides ?? [],
            }),
          }).finally(() => {
            isSavingDeckRef.current = false;
          });
        }
      } else {
        setDeckStatus("parse_failed");
        setLastDeckError("The response did not include a complete deck.");
      }
    },
    onError: (error) => {
      stopTaskStream();
      setTaskStatus(null);
      setDeckStatus("parse_failed");
      setLastDeckError(error.message || "Request failed.");
    },
  });

  const activateDeck = useCallback(
    ({
      deckId,
      chatHistory,
      persistedDeck,
    }: {
      deckId: number;
      chatHistory?: Array<{
        id: string;
        role: "user" | "assistant" | "system";
        content: string;
      }>;
      persistedDeck?: {
        title: string;
        subtitle?: string;
        slides: ParsedSlide[];
      };
    }) => {
      setActiveDeckId(deckId);
      if (persistedDeck) {
        setDeck(normalizeDeck(persistedDeck));
        setDeckStatus("ready");
        setLastDeckError(null);
      } else {
        setDeck(null);
        setDeckStatus("idle");
      }

      if (chatHistory?.length) {
        chat.setMessages(chatHistory as unknown as Message[]);
      } else {
        chat.setMessages([initialMessage]);
      }
    },
    [chat.setMessages]
  );

  const deactivateDeck = useCallback(() => {
    setActiveDeckId(null);
    setDeck(null);
    setDeckStatus("idle");
    setLastDeckError(null);
    chat.setMessages([initialMessage]);
  }, [chat.setMessages]);

  const value = useMemo<ChatState>(
    () => ({
      messages: chat.messages,
      input: chat.input,
      isLoading: chat.isLoading,
      handleInputChange: chat.handleInputChange,
      handleSubmit: chat.handleSubmit,
      stop: chat.stop,
      deck,
      deckStatus,
      lastDeckError,
      taskStatus,
      setDeck,
      activeDeckId,
      activateDeck,
      deactivateDeck,
    }),
    [
      chat.messages,
      chat.input,
      chat.isLoading,
      chat.handleInputChange,
      chat.handleSubmit,
      chat.stop,
      deck,
      deckStatus,
      lastDeckError,
      taskStatus,
      activeDeckId,
      activateDeck,
      deactivateDeck,
    ]
  );

  useEffect(() => {
    if (!activeDeckId || chat.isLoading) return;

    clearChatSaveTimer();
    chatSaveTimerRef.current = setTimeout(() => {
      const normalizedMessages = chat.messages
        .filter(
          (message): message is Message & { content: string } =>
            (message.role === "user" ||
              message.role === "assistant" ||
              message.role === "system") &&
            typeof message.content === "string"
        )
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }));

      void fetch(`/api/decks/${activeDeckId}/chat`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: normalizedMessages,
        }),
      });
    }, 600);

    return () => {
      clearChatSaveTimer();
    };
  }, [activeDeckId, chat.isLoading, chat.messages]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatState() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatState must be used within ChatProvider.");
  }
  return context;
}
