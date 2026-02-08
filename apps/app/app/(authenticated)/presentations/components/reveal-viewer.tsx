"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import "./reveal-print.css";

type Slide = {
  title: string;
  content?: string;
  bullets?: string[];
  children?: Slide[];
};

type RevealViewerProps = {
  slides: Slide[];
  className?: string;
  style?: CSSProperties;
};

function renderSlideContent(slide: Slide) {
  return (
    <>
      <h2>{slide.title}</h2>
      {slide.content && <p>{slide.content}</p>}
      {slide.bullets && (
        <ul>
          {slide.bullets.map((bullet, bulletIndex) => (
            <li key={`${slide.title}-bullet-${bulletIndex}`}>{bullet}</li>
          ))}
        </ul>
      )}
    </>
  );
}

export function RevealViewer({ slides, className, style }: RevealViewerProps) {
  const deckDivRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<import("reveal.js").Api | null>(null);

  useEffect(() => {
    const root = deckDivRef.current;
    if (!root || deckRef.current) return;

    let cancelled = false;

    const initDeck = async () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        document.documentElement.classList.toggle("reveal-print", params.has("print-pdf"));
      }

      const Reveal = (await import("reveal.js")).default;
      if (cancelled) return;

      const deck = new Reveal(root, {
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: "slide",
        embedded: true,
        keyboardCondition: "focused",
      });

      deckRef.current = deck;
      await deck.initialize();
      if (!cancelled) {
        deck.sync();
        deck.layout();
      }
    };

    void initDeck();

    return () => {
      cancelled = true;
      try {
        deckRef.current?.destroy();
      } catch {
        // Reveal.js may throw during cleanup in dev mode.
      } finally {
        deckRef.current = null;
        document.documentElement.classList.remove("reveal-print");
      }
    };
  }, []);

  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;

    // Keep Reveal's internal slide cache in sync when React updates slides.
    deck.sync();
    deck.layout();
    deck.slide(0, 0);
  }, [slides]);

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 520, ...style }}
    >
      <div className="reveal" ref={deckDivRef}>
        <div className="slides">
          {slides.map((slide, index) => (
            slide.children && slide.children.length > 0 ? (
              <section key={`${slide.title}-${index}`}>
                <section key={`${slide.title}-${index}-root`}>
                  {renderSlideContent(slide)}
                </section>
                {slide.children.map((child, childIndex) => (
                  <section key={`${slide.title}-child-${child.title}-${childIndex}`}>
                    {renderSlideContent(child)}
                  </section>
                ))}
              </section>
            ) : (
              <section key={`${slide.title}-${index}`}>
                {renderSlideContent(slide)}
              </section>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
