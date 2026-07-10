# Repaso

Personal study hub — upload HTML reviewers, open them anywhere, keep notes.

**Stack:** Next.js · Neon Postgres · Auth.js · Vercel

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` and fill in the values before running — the app needs a Neon connection string, Google OAuth credentials, and `ALLOWED_EMAIL`.

## Icons

App icons are generated from inline SVGs via `sharp`. After changing the icon design, regenerate every size in one pass:

```bash
node scripts/make-icons.mjs
```
