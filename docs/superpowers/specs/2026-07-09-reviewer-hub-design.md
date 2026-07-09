# Reviewer Hub — Design Spec

**Date:** 2026-07-09
**Status:** Approved design, pre-implementation
**App name:** **Repaso** (chosen 2026-07-09 with Direction A prototype; repo stays `reviewer-hub`)
**Visual direction:** **Direction A — "Warm Paper Desk"** (`prototypes/prototype-a-repaso.html`): cream/ink/terracotta palette, Fraunces + Karla + Caveat type, index-card library with washi-tape accents, ruled-paper card texture, warm paper grain. Shawn's read: homey, Google Keep-like warmth, Apple-level sleekness — build to that bar.

## 1. Goal

A personal study app for Shawn: upload single-file HTML reviewers, have them stored permanently in the cloud, open any of them instantly from an app icon on phone or laptop, and keep notes. Single user. **₱0/month is a hard requirement.**

## 2. Non-goals (v1) — with upgrade paths

- **No multi-user accounts or sharing** — but the design must not block it. Everything is already keyed by `user_id` and the only single-user mechanism is the `ALLOWED_EMAIL` allow-list; going public later = remove the allow-list, add sign-up onboarding, and revisit rate limiting + quotas. (Possible future: public app, ads/monetization.)
- **No file types other than `.html`/`.htm`** — but keep the door open. All file handling goes through one upload/validation module and one viewer component, so adding PDF/images later = extend those two places plus a `content_type` column; no restructuring.
- No subjects/tags, search, exam countdowns, pins, or export (deferred to v1.5 shelf)
- No native mobile app — PWA installability covers the "app icon" requirement

## 3. v1 Scope

1. **Google sign-in, once per device** — Auth.js with Google provider; session lifetime 90 days, refreshed on use. After first sign-in the app opens directly into the library.
2. **Library screen** — uploaded reviewers in a grid, newest first. Shows title and upload date.
3. **Upload** — drag-and-drop zone + tap-to-pick; multiple files per drop. Client and server both validate: `.html`/`.htm` only, ≤ 5 MB per file. Title defaults to the file's `<title>` or filename, editable inline.
4. **Viewer** — reviewer rendered full-screen in a sandboxed iframe (`sandbox="allow-scripts"`, no same-origin) so uploaded content cannot access the app's session or DOM. Slide-out notes panel alongside.
5. **Notes** — markdown with live preview, autosave (debounced). One note per reviewer + one global scratchpad reachable from the library.
6. **PWA** — web manifest + icons + minimal service worker for shell caching; installable on Android/iOS ("Add to Home Screen") and desktop.

### v1.5 shelf (post-launch, each independently small)
Subjects/tags · full-text search · exam countdowns · pins · export/import backup file · rename/delete management UI · settings screen with alternate UI themes (Shawn's idea — the unpicked prototype directions, Aral and STUDYO, become ready-made theme candidates).

## 4. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router, TypeScript)** | React UI + API routes in one codebase; top industry framework; major learning goal |
| Hosting | **Vercel Hobby** | git push → deploy; no server to manage or keep awake; free, no card |
| Database | **Neon Postgres (Free)** | Managed, durable, free, no card; autosuspend wakes ~1 s (no user-visible cold start) |
| Auth | **Auth.js (NextAuth) + Google provider** | Login once per device; long-lived JWT session cookie |
| Data access | **Drizzle ORM** (or Prisma if Drizzle fights the setup) | Typed, parameterized queries by default |

**Free-tier guarantee:** Vercel Hobby and Neon Free require no payment method, so accidental charges are impossible. Personal-scale usage sits far below all quotas (Vercel: 100 GB bandwidth, 1 M function invocations/mo; Neon: 0.5 GB storage ≈ hundreds of reviewers, 100 CU-hrs/mo).

## 5. Architecture

```
Phone / Laptop — installed PWA (Next.js React frontend)
      │ HTTPS
      ▼
Vercel — Next.js API routes (session check on every call)
      │
      ▼
Neon Postgres — users, reviewers (HTML content as text), notes
```

- Reviewer HTML is stored **in the database as text** (they are single-file HTML documents). No blob storage service needed; nothing lives on ephemeral disk.
- Viewer fetches the HTML via an authenticated API route and renders it into the sandboxed iframe via `srcdoc`/blob URL.

## 6. Data model

```
users      id · google_sub (unique) · email · name · created_at
reviewers  id · user_id → users · title · html_content (text) · size_bytes
           · created_at · updated_at · last_opened_at
notes      id · user_id → users · reviewer_id → reviewers (nullable; null = global scratchpad)
           · content_md (text) · updated_at
```

- All queries filtered by `user_id` from the session — never from client input.
- Allow-list check at sign-in: only Shawn's Google account (`ALLOWED_EMAIL` env var) may create a session; anyone else is rejected. Keeps the deployed URL private in effect even though it is public in fact.

## 7. Screens

1. **Sign-in** — single "Continue with Google" button (seen once per device)
2. **Library** — grid of reviewer cards, upload zone, scratchpad button
3. **Viewer** — full-screen reviewer + slide-out notes panel; back to library
4. *(v1 has no settings screen — nothing to configure yet)*

## 8. Security

- Auth.js session (http-only, secure cookie); every API route verifies session and `ALLOWED_EMAIL`
- Upload validation server-side: extension + MIME + 5 MB cap; content stored as inert text
- Sandboxed iframe isolates uploaded HTML from app origin/session
- Parameterized queries via ORM; secrets only in Vercel env vars (never in git)
- Rate limiting deferred: single allow-listed user; revisit if sharing is ever added

## 9. Error handling

- Upload rejected → inline message stating why (type/size)
- Network/API failure while editing notes → local draft kept in memory + localStorage until save succeeds; banner shows "not saved yet"
- Session expired → redirected to sign-in; notes draft survives via localStorage
- Neon wake latency (~1 s) → indistinguishable from normal load; no special UI needed

## 10. Testing & verification

- API route tests: auth rejection (no session / wrong email), upload validation, notes CRUD, reviewer fetch scoping
- End-to-end verify before ship: sign in → upload real STAT 023 reviewer → open it → write note → reload → everything persists
- PWA install test on Shawn's actual phone as the final acceptance step

## 11. One-time setup Shawn does (all free, guided)

1. GitHub repo (existing account)
2. Vercel account via GitHub sign-in
3. Neon account via GitHub sign-in
4. Google OAuth client ID/secret in Google Cloud console (free; existing Google account)

## 12. Build order

Prototypes (3+ looks, pick one) → project scaffold → schema + migrations → auth → upload/library/viewer/notes → PWA → security pass → deploy → phone install test.
