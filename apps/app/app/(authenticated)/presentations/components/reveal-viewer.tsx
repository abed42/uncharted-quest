"use client";

import { useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/white.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type Slide = {
  title: string;
  content?: string;
  bullets?: string[];
};

type RevealViewerProps = {
  slides: Slide[];
  className?: string;
};

export function RevealViewer({ slides, className }: RevealViewerProps) {
  const deckDivRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<import("reveal.js").Api | null>(null);

  useEffect(() => {
    if (deckRef.current) return;

    const initDeck = async () => {
      const Reveal = (await import("reveal.js")).default;

      deckRef.current = new Reveal(deckDivRef.current!, {
        embedded: true,
        keyboardCondition: "focused",
        transition: "slide",
        controls: true,
        progress: true,
        center: true,
        hash: false,
      });

      await deckRef.current.initialize();
    };

    initDeck();

    return () => {
      try {
        deckRef.current?.destroy();
        deckRef.current = null;
      } catch {
        // Reveal.js may throw during cleanup in dev mode
      }
    };
  }, []);

  return (
    <div
      className={className}
      style={{ width: "100%", height: "500px" }}
    >
      <div className={`reveal ${poppins.className}`} ref={deckDivRef}>
        <div className="slides">
          {slides.map((slide, index) => (
            <section key={index}>
              <h2>{slide.title}</h2>
              {slide.content && <p>{slide.content}</p>}
              {slide.bullets && (
                <ul>
                  {slide.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
