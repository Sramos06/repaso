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

---

## Addendum — v1.7 (locked 2026-07-12, post-v1.6 ship)

Six "complete the loop" features, two themes: **find & jump** and **take it with you**. UI iterates on the locked shell (no prototype round). No schema change (the desk query adds `lastOpenedAt`, which already exists).

1. **Continue studying** — a strip atop the desk with the last few opened reviewers (uses `lastOpenedAt`). Hidden while searching or when none opened.
2. **Command palette** — Ctrl/Cmd-K overlay to jump to any reviewer by name (arrow keys + Enter); the search bar stays the mobile path.
3. **Search snippets** — content-search results show the matching sentence with the term highlighted. `makeSnippet` returns PLAIN text (content_text is search-only and may contain tag-shaped text); the client highlights by splitting into React nodes, NEVER `dangerouslySetInnerHTML`. Search API contract `{ ids }` → `{ results: [{ id, snippet }] }`.
4. **Download the .html** — save the original single-file HTML back to the device: a ⋯-menu action in the app and a Download button on the public `/s/<token>` page.
5. **Everything readable offline** (the real PUP win) — precache EVERY reviewer's page shell + content, not just opened ones. A plain client `fetch` won't cache a page-shell navigation, so the client posts the URL list and a service-worker `message` handler `cache.put`s them. SW `VERSION` → v2; offline navigation fallback uses `{ ignoreVary: true }` (Next sets Vary). Read-only, no writes/sync — the low-risk stepping stone toward the promoted full local-first version, not that version.
6. **Available-offline indicator + offline banner** — per-card badge when a reviewer's content is cached (`caches.match`); an app-level "Offline — showing your saved reviewers" banner (mounted in layout, `navigator.onLine`).

Plan: `docs/superpowers/plans/2026-07-12-repaso-v1.7.md`.

## Addendum — v1.8 (locked 2026-07-13, post-v1.7 ship)

**Settings surface + Themes.** First real "home surface" — built once so future clusters (bulk actions, duplicate, stats, offline-storage readout) drop into it later. This version ships the shell + its first tenant, Themes. No speculative empty sections (YAGNI). Palettes approved from the live preview `prototypes/themes/theme-preview.html`.

1. **`/settings` page** — a real route, reached from the avatar menu. Three sections: **Appearance** (theme picker), **Your data** (Export + Import/restore, *moved here* from the avatar menu — the exact existing `exportBackup`/`importBackup` flows, relocated), **Account** (email + Log out). The avatar menu slims to: email · ⚙ Settings · Log out (Log out stays in the menu for one-tap access).
2. **Four themes** — `warm` (default, current look), `night` (dark: warm espresso ground, orange as low glow/accent only — never orange-on-black), `coffee` (espresso ink / latte paper / caramel accent), `matcha` (green accent replaces terracotta, rice-paper ground). A theme is ONLY a re-set of CSS custom properties; no component/markup changes.
3. **Tokenize the chrome** — lift the still-hardcoded values in `globals.css` into custom properties so dark reads correctly: background glow (`--glow-1/2`), grain opacity (`--grain`), washi tape (`--washi-1/2/3`), card-label backing (`--subject-bg`), hover/menu shadows (`--shadow-hover`), modal scrim (`--scrim`), fab hover (`--ink-hover`), on-accent text (`--on-accent`). Then four `[data-theme]` blocks. **Chrome themes; the content stage stays neutral** — the reviewer iframe and the white page it sits on never change (uploaded reviewers are light HTML; forcing dark breaks their contrast). Scratchpad `.docpage` counts as content stage → stays light.
4. **Synced, no flash** — new `theme` column on the user row (default `warm`; server validates it's one of the four). `PATCH /api/settings` saves it, owner-scoped, extensible name. The **root layout reads the saved theme server-side and stamps `data-theme` on `<html>` before first paint** → correct even on a brand-new device, no dark-mode flash. localStorage caches it so the picker applies optimistically/instantly, then confirms to the server. Public `/s/<token>` has no user → default `warm`.
5. **One source of truth** — `src/lib/themes.ts` exports the four themes (id + label + swatch), the `Theme` type, and an `isTheme`/`coerceTheme` guard; imported by the picker, the layout, and the PATCH endpoint.

Schema note: apply the `theme` column via a direct Neon `.mjs` script (drizzle-kit push still blocks on the NULLS-NOT-DISTINCT prompt in non-TTY). Tests: theme guard (rejects junk → `warm`) + settings PATCH (rejects invalid, owner-scoped). Visual re-skin verified in the live preview.

Plan: `docs/superpowers/plans/2026-07-13-repaso-v1.8.md`.

## Addendum — v1.9 (locked 2026-07-14, post-v1.8 ship)

**"Study flow"** — five near-term standalone items + one mobile bugfix. No new surfaces; everything rides existing seams. One new table (`note_revisions`), applied via direct Neon `.mjs` as usual.

0. **Mobile avatar-menu fix (bug)** — root cause: the v1-era mobile media query targets `.avatar { order: 2; margin-left: auto; }`, but since v1.5 the header's flex child is `.avatar-wrap`, so the rules are dead — the wrap defaults to first position (avatar renders LEFT on mobile) and the 220px dropdown, still `right: 0`-anchored to that 40px wrap, extends off-screen. **Shawn's call: the avatar STAYS where it currently renders (left)**; fix the menu instead — inside the `max-width: 760px` block, delete the dead `.avatar` rule and add `.menu { left: 0; right: auto; }` so the dropdown opens into the screen. Verify at mobile viewport.
1. **Replace file (keep notes)** — ⋯ menu "Replace file…" → file picker → `PUT /api/reviewers/[id]/file` with the new HTML. Server applies the SAME validation as upload (type/4MB via `validate-upload`), then updates `htmlContent` + re-stripped `contentText` + `sizeBytes` + `updatedAt` ONLY. Title (renames win over the new file's `<title>`), subject, pin, archive state, notes, and `share_token` all survive. `lastOpenedAt` untouched (replacing ≠ studying). **Offline-cache seam:** the SW precache handler skips URLs already cached, so a replaced reviewer would stay stale offline — after a successful replace, the client deletes `/api/reviewers/<id>` + `/viewer/<id>` from all caches and re-triggers precache (new `refreshReviewerCache(id)` in `offline-cache.ts`).
2. **Notes version history** — new `note_revisions` table (`id`, `noteId` FK cascade, `userId`, `contentMd`, `createdAt`). On note save where content changed: snapshot the PREVIOUS content, at most one snapshot per 10-minute window, skip if previous was empty; keep the newest 30 per note (prune older). Restore: always snapshots the current text first (bypassing the window — even restores are undoable), then writes the revision's content. UI: 🕐 in the notes drawer header → list of timestamps → tap to preview → Restore. Read-only list + restore; no diffing (YAGNI).
3. **Notes → printable sheet** — Print action in the notes drawer → `/print/notes/[id]` (`[id]` = reviewer uuid or `scratchpad`, matching the viewer convention; auth-gated by the default middleware matcher). Server component renders the note through the existing `render-md.ts` (escape-first — safe) on a clean, light, ink-friendly sheet (reviewer title + date header), and a tiny client component calls `window.print()` on mount. Content stage stays light in every theme (same rule as v1.8).
4. **PWA app shortcuts** — `manifest.ts` gains `shortcuts`: **Scratchpad** → `/viewer/scratchpad`, **Continue studying** → `/continue` (new route: latest `lastOpenedAt` → redirect to `/viewer/<id>`, fallback `/`; protected by default matcher).
5. **Wake-lock reading mode (automatic)** — Shawn's pick: no UI. While the viewer is open, request `navigator.wakeLock` (feature-detected, silent on failure/unsupported), re-acquire on `visibilitychange → visible`, release on unmount. The browser auto-releases on tab switch/manual lock, so drain only happens while actually reading.

Tests: revision snapshot policy (window/cap/skip-empty) as pure logic, replace-file validation reuse, plus existing suites. Visual/mobile checks in live preview.

Plan: `docs/superpowers/plans/2026-07-14-repaso-v1.9.md`.

## Addendum — v1.10 (locked 2026-07-14, post-v1.9 ship; from the road-to-2 prototype round)

**"Manage & measure"** — the Settings-bundle round plus Shawn's ⋯-menu redesign. Prototype source of truth: `prototypes/road-to-2/road-to-2.html` (round 2). **UI copy rule from this version on: NO em-dashes in user-facing text; clear, short, professional wording.**

1. **⋯ menu redesign (Shawn's spec)** — exactly five items, no section headers, thin separator before Delete: **✏️ Rename · ⧉ Duplicate · 📤 Send · 🗄 Archive · 🗑 Delete.** Removed: Pin (the 📌 corner button already does it), Download and Share link (absorbed into Send), and **Replace file entirely** (Shawn: redundant with re-uploading; caveat that notes/share-link don't carry over was flagged and accepted). Remove the ⋯ item, the DeskClient flow, `PUT /api/reviewers/[id]/file`, and the now-orphaned `refreshReviewerCache` (git history keeps them).
2. **Send sheet** — replaces the old share dialog. One modal: the capability link + **Copy**, **"Send via…"** (native `navigator.share` with title + URL; button hidden when unsupported, e.g. desktop Firefox), **Download file** (existing client download), small **"Turn off link"** danger action. Opening the sheet mints the token idempotently (same POST as today). Same security model: token-only capability URL, revocable, never in exports.
3. **Duplicate** — server-side `POST /api/reviewers/[id]/duplicate`: owner-scoped insert copying `htmlContent`/`contentText`/`sizeBytes`/`subject`; title = `"<title> (copy)"` (truncated to 200); NOT copied: pinned, archivedAt, shareToken, lastOpenedAt, notes. Returns the new id; desk refreshes.
4. **Manage mode (bulk actions)** — "☑ Select" pill in the "On the desk" section label (per prototype). Tapping cards toggles selection (ring + check bubble); a floating bottom bar shows count + **Archive / Export / Delete**. Delete requires one confirm modal ("Delete N reviewers and their notes?"). Implementation: client loops over the existing per-id endpoints (personal scale); Export-selected reuses the backup-v2 assembler filtered to the selection (`repaso-selection-YYYY-MM-DD.json`). Exiting manage mode ("✕ Done") clears selection. Archived drawer cards are selectable too when the drawer is open.
5. **Offline storage readout (Settings)** — new "Offline storage" section between Appearance and Your data. Copy explains plainly: device copies for offline reading, separate from cloud, clearing never touches the cloud. Shows: total (sum of cached reviewers' `sizeBytes`) + count, a quota bar via `navigator.storage.estimate()` with the honest caption that the browser allows far more than reviewers will ever need, a per-reviewer list (title, size, ● offline dot) for cached items, and two actions: **⟳ Refresh offline copies** (evict reviewer entries, re-precache) and **✕ Clear offline copies** (evict only; SW re-precaches on next desk load anyway — copy states cloud is untouched). New tested util `formatBytes`.
6. **Open-events seam (no UI)** — new `open_events` table (`id`, `userId`, `reviewerId` FK cascade, `openedAt` default now). The existing `POST /api/reviewers/[id]/open` also inserts one row per open. Nothing reads it yet; it accrues history so a future stats screen starts with months of real data instead of zero. ~50 bytes/open, trivial for Neon's free tier.
7. **Em-dash sweep** — replace every em-dash in existing user-facing strings (notes placeholder, offline banner, modal subs, empty states, etc.) with commas/periods/colons. Code comments are exempt.

Queued after this (v1.11 "Upload makeover", direction locked in the same prototype round, own addendum when its turn comes): split-zone upload (Option A: drop side + paste-HTML door, folds under on mobile), staging tray with sizes/preview/per-file rejects that clears itself after confirm, paste-HTML capture with title from `<title>`, and **browser-side compression** (native CompressionStream, no deps) to raise the effective cap to roughly 15–25 MB of raw HTML. Then v2.0 local-first, own brainstorm.

Schema note: `open_events` via direct Neon `.mjs` (drizzle-kit push still blocks). Tests: `formatBytes`, duplicate-title derivation, plus existing suites. Visual checks in live preview per prototype.

Plan: `docs/superpowers/plans/2026-07-14-repaso-v1.10.md`.

## Addendum — v1.11 (locked 2026-07-14, post-v1.10 ship)

**"Upload makeover"** — the upload experience from the road-to-2 prototype (Shawn's picks: Option A split zone; staging tray; paste HTML). Scope decision 2026-07-14: **compression is NOT in this version.** Lifting the 4 MB cap requires compressed-at-rest storage (Vercel also caps responses ~4.5 MB, so large raw files could be stored but never served), which is a data-format migration touching viewer/share/download/export/import/duplicate/offline paths. That becomes **v1.12 "Big files"** with its own spec. v1.11 keeps the 4 MB cap and no schema/endpoint changes: everything reuses `POST /api/reviewers` and the pure `validateUpload`.

1. **Split-zone upload (Option A)** — one dashed zone, two doors. Left: drop/click files (existing behavior). Right: a narrower "✂ Paste HTML" door (gold-tinted). On phones (≤620px) the paste door folds under the drop area as a slim horizontal strip. Replaces the current single-purpose zone; same handler underneath.
2. **Staging tray (nothing saves on drop anymore)** — dropping/picking files STAGES them in a tray under the zone instead of uploading immediately. Client-side pre-validation reuses the same pure `validateUpload` (extension, 4 MB, non-empty, title from `<title>`), so rejects are flagged instantly ("won't be added" + reason) without a wasted request. Per staged file: name, `formatBytes` size, detected title, **👁 Preview** (sandboxed iframe modal: `sandbox="allow-scripts"` + `referrerPolicy="no-referrer"` + `srcDoc`, same rules as the viewer), ✕ remove. Confirm row: "Adding N files · X MB" + "Add N to desk" → sequential per-file POSTs to the existing endpoint → **honest results** (v1.10 rule): full success clears the tray with a toast + refresh; partial failure removes the successes and keeps failures in the tray with the server's reason. Dropping more files while the tray is open appends. The tray exists only mid-upload.
3. **Paste HTML** — the paste door opens a modal: monospace textarea + Title input that auto-fills live from the pasted content (`<title>` text → else first `<h1>` text → else "Pasted reviewer"), editable, capped 200. Save posts directly (constructs an in-memory `.html` File and reuses the same upload endpoint + validation; no tray detour, one step). Inline errors for empty paste and the 4 MB cap. New pure lib `pasteTitle(html): string`, tested.
4. **Copy rules** — all new strings clear, short, professional, and em-dash free.

Structure: `UploadZone.tsx` grows into the split zone + owns tray/paste state; extract `StagingTray.tsx` and `PasteModal.tsx` as focused components. No middleware, schema, or endpoint changes; iframe sandbox rules identical to the viewer.

Queued after this: **v1.12 "Big files"** (compressed-at-rest via native CompressionStream/DecompressionStream, ~15–25 MB effective raw cap, migrates existing rows, own spec + review focus) then **v2.0 local-first** (own brainstorm).

Plan: `docs/superpowers/plans/2026-07-14-repaso-v1.11.md`.
