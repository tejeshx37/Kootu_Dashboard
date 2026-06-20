# Kootu Admin Dashboard

Internal admin console for the Kootu offers/deals aggregation platform (Tamil Nadu merchants).

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma + SQLite (dev)
- NextAuth.js (credentials provider, admin only)
- Google Gemini SDK (`gemini-2.5-flash`) for AI offer extraction
- `mammoth` (DOCX) + `pdf-parse` (PDF) for file parsing

## Setup

```bash
npm install
# Optional: override secrets locally (the tracked .env has SQLite + dev defaults)
cp .env.example .env.local
# then edit .env.local and set GEMINI_API_KEY
npx prisma db push
npm run db:seed
npm run dev
```

The repo ships a tracked `.env` with SQLite + dev placeholders so Prisma and
Next.js work out of the box. Put real secrets (especially `ANTHROPIC_API_KEY`)
in `.env.local`, which is gitignored and takes precedence.

URL extraction works by server-side fetching the page HTML and stripping
tags before sending it to Gemini — pages that require JavaScript or auth
won't yield useful text.

Login: `admin@kootu.in` / `admin123` (configurable via `.env.local`).

## Routes

- `/login` — credentials sign-in
- `/dashboard` — stats + recent offers + pending merchant approvals
- `/extractor` — AI extractor (URL / Text / PDF / DOCX)
- `/offers` — offer management
- `/merchants` — merchant management

All `/dashboard`, `/extractor`, `/offers`, `/merchants` routes are gated by `middleware.ts`.

## API

- `GET|POST /api/merchants`
- `PATCH /api/merchants/:id`
- `GET|POST /api/offers`
- `PATCH|DELETE /api/offers/:id`
- `POST /api/extract` — multipart form with `sourceType` (`url|text|pdf|docx`), `content`, `file`

The Gemini key never leaves the server — all extraction goes through `/api/extract`, which also requires an authenticated admin session.
