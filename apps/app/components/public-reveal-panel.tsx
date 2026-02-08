"use client";

import { useEffect, useState } from "react";
import { cn } from "@repo/design-system/lib/utils";

type Slide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: Slide[];
};

type PublicRevealPanelProps = {
  slides: Slide[];
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

function buildRevealSrcDoc(slides: Slide[]) {
  const slidesMarkup = slides.map(renderSlide).join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/black.css" />
    <style>
      body { margin: 0; background: #191919; }
      .reveal { height: 100vh; }
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

export function PublicRevealPanel({ slides, className }: PublicRevealPanelProps) {
  const [mounted, setMounted] = useState(false);
  const srcDoc = buildRevealSrcDoc(slides);

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
            className="h-full w-full rounded-md border-0"
          />
        ) : (
          <div className="h-full w-full rounded-md bg-muted" />
        )}
      </div>
    </div>
  );
}
