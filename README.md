# Kootu Admin Dashboard

Internal admin console for the Kootu offers/deals aggregation platform (Tamil Nadu merchants).

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma + SQLite (dev)
- NextAuth.js (credentials provider, admin only)
- Anthropic SDK (`claude-sonnet-4-6`) for AI offer extraction
- `mammoth` (DOCX) + `pdf-parse` (PDF) for file parsing

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in ANTHROPIC_API_KEY
npx prisma db push
npm run db:seed
npm run dev
```

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

The Anthropic key never leaves the server — all extraction goes through `/api/extract`.
