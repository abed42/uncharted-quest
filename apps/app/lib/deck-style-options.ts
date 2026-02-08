export const DECK_BACKGROUND_OPTIONS = [
  "#5-1.png",
  "#5-2.png",
  "#5.png",
  "#6-1.png",
  "#6-2.png",
  "#6-3.png",
  "#6.png",
  "#7-1.png",
  "#7.png",
  "#8.png",
  "BG-desktop.png",
  "Bonus-1.png",
  "Bonus.png",
  "Demo.png",
  "Demo (1).png",
  "Demo (2).png",
  "Demo (3).png",
  "Demo-1.png",
  "Demo-2.png",
  "Demo-3.png",
  "Demo-4.png",
  "Demo-5.png",
  "Demo-6.png",
  "Example.png",
  "Example-1.png",
  "Example-2.png",
  "Example-3.png",
  "Futuristic Demo-1.png",
  "Futuristic Demo-2.png",
  "Futuristic Demo-3.png",
  "Futuristic Demo-4.png",
  "Futuristic Demo.png",
  "Futuristic Demo (1).png",
  "Monochrome - 9.png",
  "Tree of Life - 4.png",
  "hackathon-bg.png",
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

export function getDeckBackgroundPublicPath(backgroundImage?: string | null): string | null {
  if (!backgroundImage) return null;

  if (backgroundImage.startsWith("/")) {
    return encodeURI(backgroundImage);
  }

  if (backgroundImage.includes("/")) {
    return encodeURI(`/${backgroundImage}`);
  }

  return encodeURI(`/backgrounds/${backgroundImage}`);
}
