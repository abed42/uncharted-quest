export const DECK_BACKGROUND_OPTIONS = [
  "hackathon-bg.png",
  "BG-desktop.png",
  "Bonus.png",
  "Demo.png",
  "Demo (1).png",
  "Demo (2).png",
  "Demo (3).png",
  "Futuristic Demo.png",
  "Futuristic Demo (1).png",
] as const;

export const DECK_FONT_OPTIONS = [
  "Instrument Serif",
  "Inter",
  "Poppins",
  "Roboto",
] as const;

export type DeckBackgroundOption = (typeof DECK_BACKGROUND_OPTIONS)[number];
export type DeckFontOption = (typeof DECK_FONT_OPTIONS)[number];

export function isDeckBackgroundOption(value: unknown): value is DeckBackgroundOption {
  return (
    typeof value === "string" &&
    DECK_BACKGROUND_OPTIONS.includes(value as DeckBackgroundOption)
  );
}

export function isDeckFontOption(value: unknown): value is DeckFontOption {
  return typeof value === "string" && DECK_FONT_OPTIONS.includes(value as DeckFontOption);
}

export function getBackgroundOptionsPromptList(): string {
  return DECK_BACKGROUND_OPTIONS.map((value) => `- ${value}`).join("\n");
}

export function getFontOptionsPromptList(): string {
  return DECK_FONT_OPTIONS.map((value) => `- ${value}`).join("\n");
}

export function getDeckStyleFallback(): {
  backgroundImage: DeckBackgroundOption;
  fontFamily: DeckFontOption;
} {
  return {
    backgroundImage: "hackathon-bg.png",
    fontFamily: "Instrument Serif",
  };
}
