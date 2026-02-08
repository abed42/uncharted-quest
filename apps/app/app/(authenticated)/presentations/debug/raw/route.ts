const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Reveal Debug Deck</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/theme/black.css" />
    <style>
      body {
        margin: 0;
        background: #191919;
      }
      .reveal {
        height: 100vh;
      }
    </style>
  </head>
  <body>
    <div class="reveal">
      <div class="slides">
        <section>
          <h1>Reveal.js Debug</h1>
          <p>Pure HTML + JS baseline.</p>
          <small>Press ESC for overview.</small>
        </section>
        <section>
          <h2>Horizontal Slide</h2>
          <p>This mirrors the docs structure.</p>
        </section>
        <section>
          <section>
            <h2>Vertical Slides</h2>
            <p>Top level content</p>
          </section>
          <section>
            <h2>Basement 1</h2>
            <p>First vertical child</p>
          </section>
          <section>
            <h2>Basement 2</h2>
            <p>Second vertical child</p>
          </section>
        </section>
        <section>
          <h2>Another Horizontal</h2>
          <p>Use arrow keys to navigate.</p>
        </section>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.2.1/dist/reveal.js"></script>
    <script>
      const deck = new Reveal({
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: "slide"
      });
      deck.initialize();
    </script>
  </body>
</html>
`;

export async function GET() {
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

