# Kootu Admin Dashboard

Internal admin console for the Kootu offers/deals aggregation platform (Tamil Nadu merchants).

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Prisma + SQLite (dev)
- NextAuth.js (credentials provider, admin only)
- Google Gemini SDK (`gemini-2.5-flash`) for AI offer extraction
- `mammoth` (DOCX) + `pdf-parse` (PDF) for file parsing
- Firebase Admin: optional Firestore mirror of all data, plus Firebase Storage for AI-extractor source uploads

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
Next.js work out of the box. Put real secrets (especially `GEMINI_API_KEY`)
in `.env.local`, which is gitignored and takes precedence. The `GEMINI_API_KEY` is the only one you must supply yourself.

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
- `POST /api/extract` — multipart form with `sourceType` (`url|text|pdf|docx|image`), `content`, `file`
- `POST /api/offers/from-ai` — multipart batch insert for AI-extracted offers; uploads the source file to Firebase Storage and attaches its URL to every created offer
- `GET /api/offers/near?lat=&lng=&radiusKm=` — active offers within `radiusKm` (default 5, max 100) of `lat,lng`, sorted by `distanceKm`. Effective coordinates fall back to the merchant's if the offer doesn't have its own.

### Location & geocoding

Both `Merchant` and `Offer` carry `address`, `area`, `latitude`, and `longitude`. Set `GOOGLE_MAPS_API_KEY` in `.env.local` to auto-geocode addresses on extraction and on manual offer/merchant creation; without it, addresses are stored as text and lat/lng stays null (the proximity endpoint just won't see those rows).

The Gemini key never leaves the server — all extraction goes through `/api/extract`, which also requires an authenticated admin session.

## Firebase (optional)

SQLite via Prisma is the source of truth. If you supply Firebase Admin
credentials, every merchant/offer/extraction-log write is mirrored to
Firestore (best-effort — failures are logged, never block the request),
and the original file behind an AI extraction is uploaded to Firebase
Storage **only when the admin actually clicks "Add Selected Offers for
Review."** That Storage URL is saved on each created offer
(`sourceFileUrl`) so reviewers can pop the original poster/PDF/DOCX in a
new tab.

To enable, set in `.env.local`:

```
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="...@....iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
```

Leave any of them blank to silently disable Firebase. The dashboard
keeps working from SQLite alone.
