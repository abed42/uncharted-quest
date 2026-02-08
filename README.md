# uncharted.quest

AI-assisted pitch deck creation with a chat-first workflow, persistent deck context, and presentation sharing.

## What It Is

`uncharted.quest` helps founders turn rough ideas into investor-ready decks quickly:

- Chat with an agent to refine the story.
- Generate and edit structured slides (including vertical drill-down slides).
- Keep deck and chat context tied to each project.
- Present in-browser via Reveal.js.
- Publish decks to a shareable URL.

## Core Features

- Context-aware deck generation and edits (`/api/chat`)
- Per-deck storage for:
  - deck content (title, subtitle, slides)
  - chat history
  - style metadata (background, font)
- Editable deck title/slug and visibility controls
- Public deck routes and presentation mode
- Animated agent status feedback in sidebar chat

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Turborepo monorepo
- Clerk auth (`@repo/auth`)
- Prisma/database package (`@repo/database`)
- OpenAI via AI SDK (`ai`, `@ai-sdk/openai`)
- Reveal.js for slide rendering/presentation
- Shared design system (`@repo/design-system`, shadcn-based)

## Repository Structure

```text
apps/
  app/                 Main product app (chat + decks + present/share)
packages/
  auth/                Auth package
  database/            Database package
  design-system/       Shared UI primitives/components
  ...                  Other shared infra packages
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 10+

### 1) Install

```bash
pnpm install
```

### 2) Configure environment

Create `apps/app/.env.local` (or root `.env.local`, depending on your setup) with at least:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

If you are using additional next-forge packages, include their required env vars as well.

### 3) Run database migrations/sync

```bash
pnpm migrate
```

### 4) Start the app

```bash
pnpm dev
```

Main app runs at `http://localhost:3000`.

## Key Product Routes

- `/home` - Deck list + create flow
- `/:username/:slug` - Owner workspace (chat + editable deck)
- `/:username/:slug?present=1` - Owner present mode
- `/share/:username/:slug` - Public shared deck page

## API Endpoints (App)

- `POST /api/decks/start` - Create a new deck
- `PATCH /api/decks/:deckId/content` - Save generated deck content + style metadata
- `PATCH /api/decks/:deckId/chat` - Save chat history
- `PATCH /api/decks/:deckId/rename` - Rename deck (updates slug)
- `PATCH /api/decks/:deckId/visibility` - Publish/unpublish
- `POST /api/chat` - Agent interaction for deck generation/edits

## Demo Flow (Hackathon)

1. Create a deck from a short prompt.
2. Use chat to refine the pitch and generate slides.
3. Confirm/adjust title suggestions.
4. Present the deck in fullscreen.
5. Publish and copy the share link.

## Notes

- This project is built on top of a `next-forge` monorepo base and customized for the Uncharted pitch workflow.
- Storage currently uses the existing database page model with serialized deck records for rapid iteration.
