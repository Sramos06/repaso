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
3. **Upload** — drag-and-drop zone + tap-to-pick; multiple files per drop. Client and server both validate: `.html`/`.htm` only, ≤ 4 MB per file (Vercel request-payload headroom). Title defaults to the file's `<title>` or filename, editable inline.
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
- Upload validation server-side: extension + MIME + 4 MB cap; content stored as inert text
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

---

## Addendum — v1.5 (locked 2026-07-11)

**Shell (round-2 prototype pick, refined):** `prototypes/round2/a-desk-drawers.html` is the visual source of truth.

- **Desk** = brand + search bar + avatar menu + card grid, nothing else. Subject filter chips and exam countdowns were CUT by Shawn (redundant with search / unwanted). Subjects survive only as an optional small label on cards (set via the rename dialog) and as searchable text.
- **Cards** gain pin (pinned-first sort), ⋯ menu (rename title+subject, pin, delete with confirm), and a "has notes" flag.
- **Avatar menu**: signed-in email, **export backup** (client-assembled JSON — Vercel response cap forces per-reviewer fetches), **log out**.
- **Viewer = focus mode**: the sandboxed iframe owns the whole screen; the only Repaso chrome is two translucent floating pills (← Desk, ✎ Notes with a dot when notes exist) in the app's own layer above the iframe — the uploaded file is never modified. Pills are always-visible-translucent (iframe swallows mouse events, so idle-hide is unreliable).
- **Notes** = slide-over drawer (right on desktop, bottom sheet on phone) with Write/Preview toggle (tiny escaped-first markdown subset — no new deps) and a ✕ close.
- **Offline easy tier**: `public/sw.js` network-first with cache fallback (shell + opened reviewers); notes drafts re-sync on the `online` event. Full local-first is a documented future route: `docs/local-first-upgrade-path.md`.
- Deferred still: themes (needs a settings screen), multi-user, non-HTML file types.

Plan: `docs/superpowers/plans/2026-07-11-repaso-v1.5.md`.

---

## Addendum — v1.6 (locked 2026-07-11, post-v1.5 ship)

Four features, all "complete the loop" on existing surface — no new screens beyond the public share page. UI iterates on the locked v1.5 shell (no prototype round, per Shawn's standing rule).

1. **Archive shelf** — `reviewers.archived_at` (nullable timestamp; null = on the desk). ⋯ menu gains Archive/Unarchive. Desk grid hides archived; below it, a collapsed `In the drawer (N)` section (seclabel idiom) expands to show archived cards slightly faded. Search matches archived too (badged). Viewer/notes unaffected.
2. **Share link (private capability URL)** — `reviewers.share_token` (nullable text, unique; 24 random bytes base64url ≈ 192-bit, generated server-side with `crypto.randomBytes`). ⋯ menu "Share link" → modal with the `https://…/s/<token>` URL, copy + revoke. Public page `/s/[token]` (middleware-exempt) renders the reviewer read-only in the SAME sandboxed iframe (`allow-scripts` only, no-referrer), content fetched client-side from public `GET /api/share/[token]` (404 on unknown/revoked). No listing anywhere; default private; tokens NEVER included in export backups. Small "Kept on Repaso ✦" footer pill for the promotion angle.
3. **Import / Restore** — avatar menu "Import backup". Client-side orchestration reusing existing endpoints (server validation + 4 MB caps apply for free): parse backup JSON (accepts version 1 and 2), per reviewer → POST /api/reviewers (File from htmlContent) → PATCH subject/pinned/archived; note → PUT /api/notes. Policies: skip reviewers whose title already exists (reported); scratchpad written only if current scratchpad is empty; createdAt not preserved (dialog copy says so). Export bumps to **version 2**: adds `pinned` + `archived` per reviewer (still no tokens, no ids needed).
4. **Content search** — `reviewers.content_text` (text): tag-stripped searchable text, populated at upload (and by a one-time backfill for existing rows; stripper = pure lib `strip-html.ts`: drop script/style blocks, strip tags, decode basic entities, collapse whitespace). New `GET /api/search?q=` (user-scoped, `ILIKE %escaped%` on content_text — fine at personal scale) returns matching ids. Desk: title/subject filtering stays instant client-side; queries ≥3 chars also debounce-hit the API and merge results, cards matched only by content get a "found inside" badge. Offline degrades to title/subject search (SW doesn't cache /api/search).

Schema deltas applied via direct SQL script (drizzle-kit push still blocked by the NULLS NOT DISTINCT prompt — v1.5 lesson). Deferred still: themes, multi-user, full local-first, published shelf, drop-box, stats (idea board).
