import "server-only";

import { database } from "@repo/database";
import {
  type DeckBackgroundOption,
  type DeckFontOption,
  isDeckBackgroundOption,
  isDeckFontOption,
} from "./deck-style-options";

const RECORD_PREFIX = "deck:";

export type DeckRecord = {
  id: number;
  ownerId: string;
  username: string;
  slug: string;
  title: string;
  prompt: string;
  isPublic: boolean;
  backgroundImage?: DeckBackgroundOption;
  fontFamily?: DeckFontOption;
  content?: DeckContent;
  chatHistory?: DeckChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type StoredDeckRecord = Omit<DeckRecord, "id">;

export type DeckContentSlide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: DeckContentSlide[];
};

export type DeckContent = {
  message?: string;
  title: string;
  subtitle?: string;
  slides: DeckContentSlide[];
};

export type DeckChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeBackgroundImage(value: unknown): DeckBackgroundOption | undefined {
  return isDeckBackgroundOption(value) ? value : undefined;
}

function normalizeFontFamily(value: unknown): DeckFontOption | undefined {
  return isDeckFontOption(value) ? value : undefined;
}

function toStored(record: DeckRecord): StoredDeckRecord {
  return {
    ownerId: record.ownerId,
    username: record.username,
    slug: record.slug,
    title: record.title,
    prompt: record.prompt,
    isPublic: record.isPublic,
    content: record.content,
    chatHistory: record.chatHistory,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function encode(record: StoredDeckRecord): string {
  return `${RECORD_PREFIX}${JSON.stringify(record)}`;
}

function decode(value: string): StoredDeckRecord | null {
  if (!value.startsWith(RECORD_PREFIX)) return null;
  try {
    const parsed = JSON.parse(value.slice(RECORD_PREFIX.length)) as Partial<StoredDeckRecord>;
    return {
      ownerId: parsed.ownerId ?? "",
      username: parsed.username ?? "",
      slug: parsed.slug ?? "",
      title: parsed.title ?? "Untitled",
      prompt: parsed.prompt ?? "",
      isPublic: parsed.isPublic ?? false,
      backgroundImage: normalizeBackgroundImage(parsed.backgroundImage),
      fontFamily: normalizeFontFamily(parsed.fontFamily),
      content: parsed.content,
      chatHistory: parsed.chatHistory,
      createdAt: parsed.createdAt ?? nowIso(),
      updatedAt: parsed.updatedAt ?? nowIso(),
    };
  } catch {
    return null;
  }
}

export function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return cleaned || "untitled";
}

async function listAllDeckRows() {
  return database.page.findMany({
    where: {
      name: {
        startsWith: RECORD_PREFIX,
      },
    },
    orderBy: {
      id: "desc",
    },
  });
}

async function listAllDecks(): Promise<DeckRecord[]> {
  const rows = await listAllDeckRows();
  return rows
    .map((row) => {
      const parsed = decode(row.name);
      if (!parsed) return null;
      return { id: row.id, ...parsed };
    })
    .filter((deck): deck is DeckRecord => Boolean(deck));
}

async function getUniqueSlug(username: string, baseSlug: string): Promise<string> {
  const decks = await listAllDecks();
  const used = new Set(
    decks
      .filter((deck) => deck.username === username)
      .map((deck) => deck.slug.toLowerCase())
  );

  if (!used.has(baseSlug.toLowerCase())) return baseSlug;

  let counter = 2;
  while (used.has(`${baseSlug}-${counter}`.toLowerCase())) {
    counter += 1;
  }

  return `${baseSlug}-${counter}`;
}

export async function listDecksForOwner(ownerId: string): Promise<DeckRecord[]> {
  const decks = await listAllDecks();
  return decks.filter((deck) => deck.ownerId === ownerId);
}

export async function createDeck(input: {
  ownerId: string;
  username: string;
  prompt: string;
}): Promise<DeckRecord> {
  const timestamp = nowIso();
  const shortId = crypto.randomUUID().slice(0, 8);
  const baseSlug = `untitled-${shortId}`;
  const slug = await getUniqueSlug(input.username, baseSlug);

  const stored: StoredDeckRecord = {
    ownerId: input.ownerId,
    username: input.username,
    slug,
    title: "Untitled",
    prompt: input.prompt,
    isPublic: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const row = await database.page.create({
    data: {
      name: encode(stored),
    },
  });

  return { id: row.id, ...stored };
}

export async function getDeckByPath(input: {
  username: string;
  slug: string;
}): Promise<DeckRecord | null> {
  const decks = await listAllDecks();
  return (
    decks.find(
      (deck) => deck.username === input.username && deck.slug === input.slug
    ) ?? null
  );
}

export async function getDeckByIdForOwner(input: {
  id: number;
  ownerId: string;
}): Promise<DeckRecord | null> {
  const row = await database.page.findUnique({ where: { id: input.id } });
  if (!row) return null;

  const parsed = decode(row.name);
  if (!parsed || parsed.ownerId !== input.ownerId) return null;

  return { id: row.id, ...parsed };
}

export async function renameDeck(input: {
  id: number;
  ownerId: string;
  title: string;
}): Promise<DeckRecord | null> {
  const row = await database.page.findUnique({ where: { id: input.id } });
  if (!row) return null;

  const parsed = decode(row.name);
  if (!parsed || parsed.ownerId !== input.ownerId) return null;

  const nextTitle = input.title.trim() || "Untitled";
  const baseSlug = slugify(nextTitle);
  const nextSlug = await getUniqueSlug(parsed.username, baseSlug);

  const next: StoredDeckRecord = {
    ...parsed,
    title: nextTitle,
    slug: nextSlug,
    updatedAt: nowIso(),
  };

  const updated = await database.page.update({
    where: { id: input.id },
    data: {
      name: encode(next),
    },
  });

  return { id: updated.id, ...next };
}

export async function saveDeckContent(input: {
  id: number;
  ownerId: string;
  content: DeckContent;
  backgroundImage?: DeckBackgroundOption;
  fontFamily?: DeckFontOption;
}): Promise<DeckRecord | null> {
  const row = await database.page.findUnique({ where: { id: input.id } });
  if (!row) return null;

  const parsed = decode(row.name);
  if (!parsed || parsed.ownerId !== input.ownerId) return null;

  const next: StoredDeckRecord = {
    ...parsed,
    content: input.content,
    backgroundImage: input.backgroundImage ?? parsed.backgroundImage,
    fontFamily: input.fontFamily ?? parsed.fontFamily,
    updatedAt: nowIso(),
  };

  const updated = await database.page.update({
    where: { id: input.id },
    data: {
      name: encode(next),
    },
  });

  return { id: updated.id, ...next };
}

export async function saveDeckChatHistory(input: {
  id: number;
  ownerId: string;
  chatHistory: DeckChatMessage[];
}): Promise<DeckRecord | null> {
  const row = await database.page.findUnique({ where: { id: input.id } });
  if (!row) return null;

  const parsed = decode(row.name);
  if (!parsed || parsed.ownerId !== input.ownerId) return null;

  const next: StoredDeckRecord = {
    ...parsed,
    chatHistory: input.chatHistory,
    updatedAt: nowIso(),
  };

  const updated = await database.page.update({
    where: { id: input.id },
    data: {
      name: encode(next),
    },
  });

  return { id: updated.id, ...next };
}

export async function setDeckVisibility(input: {
  id: number;
  ownerId: string;
  isPublic: boolean;
}): Promise<DeckRecord | null> {
  const row = await database.page.findUnique({ where: { id: input.id } });
  if (!row) return null;

  const parsed = decode(row.name);
  if (!parsed || parsed.ownerId !== input.ownerId) return null;

  const next: StoredDeckRecord = {
    ...parsed,
    isPublic: input.isPublic,
    updatedAt: nowIso(),
  };

  const updated = await database.page.update({
    where: { id: input.id },
    data: {
      name: encode(next),
    },
  });

  return { id: updated.id, ...next };
}
