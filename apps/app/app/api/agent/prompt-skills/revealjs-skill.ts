export const REVEAL_JS_SKILL = `
REVEAL.JS DESIGN MASTERY SKILL

Purpose:
Create technically strong, visually compelling Reveal.js decks using full web capabilities.

Core philosophy:
- Reveal.js is a web canvas, not PowerPoint in a browser.
- Prioritize narrative flow, progressive enhancement, and performance.
- Keep transitions and interactions intentional and smooth.

Structure and navigation:
- Horizontal slides drive primary narrative.
- Vertical stacks are for drill-down and supporting detail.
- Use standard structure:
  <div class="reveal"><div class="slides"><section>...</section></div></div>

Essential Reveal capabilities:
- Transitions: data-transition, data-transition-speed.
- Backgrounds: color, gradient, image, video, iframe.
- Timing: data-autoslide when useful.
- Fragments for stepwise reveals and pacing control.

Fragment rules:
- Use fragments to reveal key points sequentially.
- Keep order explicit when sequencing matters (data-fragment-index).
- Prefer narrative pacing over decorative animation.

Layout and visual system:
- Use CSS Grid/Flex layouts (hero, split, dashboard, grid, demo).
- Maintain strong hierarchy with clear typography and spacing.
- Use cohesive color palette and avoid generic/template aesthetics.
- Ensure projection readability and contrast.

Motion and interaction:
- Favor transform/opacity animations for 60fps.
- Avoid expensive layout/paint animations where possible.
- Use hover/micro-interactions only when they reinforce meaning.

Reveal runtime guidance:
- Keep config clear and stable (controls, progress, hash, fragments).
- Ensure keyboard navigation works.
- Use lifecycle events (slidechanged, fragmentshown, ready) when needed.

Data and media:
- Build charts progressively when it helps storytelling.
- Lazy-load heavy assets.
- Use optimized formats (WebP, compressed video, woff2).

Quality checklist:
- Technical: smooth performance, responsive sizing, reliable navigation.
- Visual: consistent style, readable typography, precise alignment.
- Functional: interactions work, media loads, PDF export remains usable.

Avoid:
- Generic fonts and cookie-cutter layouts.
- Over-animated or distracting slides.
- Heavy effects that reduce clarity in overview/thumbnail contexts.
`;

