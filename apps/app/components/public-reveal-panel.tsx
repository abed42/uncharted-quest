"use client";

import { useEffect, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";
import { getDeckStyleFallback } from "@/lib/deck-style-options";

type Slide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: Slide[];
};

type PublicRevealPanelProps = {
  slides: Slide[];
  backgroundImage?: string;
  fontFamily?: string;
  className?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSlideContent(slide: Slide) {
  const title = `<h2>${escapeHtml(slide.title)}</h2>`;
  const content = slide.content ? `<p>${escapeHtml(slide.content)}</p>` : "";
  const bullets = slide.bullets?.length
    ? `<ul>${slide.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
    : "";

  return `${title}${content}${bullets}`;
}

function renderSlide(slide: Slide) {
  if (!slide.children?.length) {
    return `<section>${renderSlideContent(slide)}</section>`;
  }

  return `<section><section>${renderSlideContent(slide)}</section>${slide.children
    .map((child) => `<section>${renderSlideContent(child)}</section>`)
    .join("")}</section>`;
}

function buildRevealSrcDoc(
  slides: Slide[],
  backgroundImageUrl: string,
  fontFamily: string
) {
  const slidesMarkup = slides.map(renderSlide).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;600;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css" />
    <style>
      html, body {
        margin: 0;
        height: 100%;
        background-color: #050505;
        background-image: url('${backgroundImageUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        color: #f3f3f3;
        font-family: '${fontFamily}', serif;
      }

      .reveal {
        height: 100vh;
        background: transparent;
        color: #f3f3f3;
        font-family: '${fontFamily}', serif;
      }

      .reveal .backgrounds {
        background-color: #050505;
        background-image: url('${backgroundImageUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }

      .reveal .slides {
        text-align: left;
      }

      .reveal section {
        width: 100%;
        min-height: 100%;
        box-sizing: border-box;
        padding: clamp(1.1rem, 2vw, 2rem) clamp(1.3rem, 3vw, 2.6rem);
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }

      .reveal h1,
      .reveal h2,
      .reveal h3,
      .reveal p,
      .reveal li {
        font-family: '${fontFamily}', serif;
        color: #f2f2f2;
        letter-spacing: 0;
        text-transform: none;
      }

      .reveal h1 { font-size: clamp(2.2rem, 6vw, 5rem); line-height: 0.95; margin: 0 0 .6rem; }
      .reveal h2 { font-size: clamp(1.9rem, 4.8vw, 4.2rem); line-height: 0.98; margin: 0 0 .6rem; }
      .reveal p { font-size: clamp(1rem, 1.7vw, 1.4rem); line-height: 1.45; margin: 0 0 .7rem; color: rgba(242,242,242,.9); }
      .reveal ul { margin: 0.4rem 0 0; padding-left: 1.2rem; }
      .reveal li { font-size: clamp(0.9rem, 1.3vw, 1.1rem); line-height: 1.4; margin: .3rem 0; color: rgba(242,242,242,.88); }

      .reveal .controls,
      .reveal .progress,
      .reveal .slide-number {
        color: rgba(255,255,255,.82);
      }
    </style>
  </head>
  <body>
    <div class="reveal">
      <div class="slides">${slidesMarkup}</div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"></script>
    <script>
      const deck = new Reveal({
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: "slide",
        embedded: true
      });
      deck.initialize();
    </script>
  </body>
</html>`;
}

export function PublicRevealPanel({
  slides,
  backgroundImage,
  fontFamily,
  className,
}: PublicRevealPanelProps) {
  const [mounted, setMounted] = useState(false);
  const fallbackStyle = getDeckStyleFallback();
  const backgroundFile = backgroundImage ?? fallbackStyle.backgroundImage;
  const normalizedBackgroundPath = backgroundFile.startsWith("/")
    ? backgroundFile
    : `/${backgroundFile}`;
  const encodedBackgroundPath = encodeURI(normalizedBackgroundPath);
  const backgroundImageUrl =
    typeof window === "undefined"
      ? encodedBackgroundPath
      : new URL(encodedBackgroundPath, window.location.origin).toString();
  const resolvedFontFamily = fontFamily ?? fallbackStyle.fontFamily;
  const srcDoc = buildRevealSrcDoc(slides, backgroundImageUrl, resolvedFontFamily);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={cn("flex h-full flex-col rounded-xl border bg-card", className)}>
      <div className="flex-1 p-4">
        {mounted ? (
          <iframe
            title="Public Reveal.js deck"
            srcDoc={srcDoc}
            key={`${encodedBackgroundPath}:${resolvedFontFamily}:${slides.length}`}
            className="h-full w-full rounded-md border-0"
          />
        ) : (
          <div className="h-full w-full rounded-md bg-muted" />
        )}
      </div>
    </div>
  );
}
