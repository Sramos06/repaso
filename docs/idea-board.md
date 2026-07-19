# Repaso Idea Board

Running list of feature ideas, grouped by *when/how* they should be built, not just liked/disliked.

_Last updated: 2026-07-18 (post-v2.1 ship)._

## Shipped
- **v1.5** (2026-07-11): search desk, pins, rename/delete, export, logout, focus viewer, offline tier.
- **v1.6** (2026-07-12): archive shelf · private share links (`/s/<token>`) · import/restore (export v2) · content search ("found inside").
- **v1.7** (2026-07-12): continue-studying row · command palette · search snippets · download .html · offline reading of every reviewer.
- **v1.8** (2026-07-13): **Settings page** (`/settings`) · four themes (warm/night/coffee/matcha, synced + no-flash) · export/import moved into Settings. **The Settings surface now EXISTS** — the bundle below is unblocked.
- **v1.9** (2026-07-14): mobile avatar-menu fix · replace file (keeps notes/link) · **notes version history** (snapshot on save, restore) · printable notes sheet · PWA shortcuts + `/continue` · automatic wake-lock. The near-term shelf is now EMPTY.
- **v1.10** (2026-07-14): five-item ⋯ menu (Rename/Duplicate/Send/Archive/Delete) with **Send sheet** · replace-file removed (Shawn's call) · **manage mode** (bulk archive/export/delete) · **duplicate** · **offline storage readout** in Settings · `open_events` accruing for future stats · UI copy fully em-dash free. Settings-bundle DONE except the stats screen itself.
- **v1.11** (2026-07-14): **upload makeover** · split zone (drop files / paste-HTML door, folds under on phones) · **staging tray** (validate + preview before saving, honest per-file results, self-clearing) · **paste HTML** capture with auto-filled editable title. Upload-makeover bundle DONE. Cap stays 4 MB until v1.12.
- **v1.12** (2026-07-16): **big files** · compressed-at-rest storage (client gzips via native CompressionStream, server stores gzip, all readers decode) lifts the cap to **15 MB raw** · decompression-bomb guard server-side · backups stay raw HTML (export decodes) · existing rows migrated (~63% smaller stored) · Neon's free 512 MB now stretches ~4-5x.
- **v2.0** (2026-07-17): **LOCAL-FIRST.** The device's IndexedDB copy is the primary copy: desk/viewer/notes render instantly online or not · every write (notes, uploads, rename/pin/archive/delete, duplicate) works offline and backs up through an ordered, crash-safe outbox · note conflicts keep BOTH texts, never drop either · multi-tab safe (Web Locks + BroadcastChannel) · offline-created reviewers open offline (viewer app shell) · SW v4 slims to shell duty · zero DB schema changes, cloud stays the backup-of-record. Built in ONE version (13 tasks); first Fable-reviewed release (caught an outbox-poisoning Critical the task gates missed).
- **v2.1** (2026-07-18): **STATS & SHINE** — the finale. **Study stats** (`/stats`): the paper "Attendance card" with streaks, days studied, visits-this-year, a GitHub-style year calendar (month/day rails, hover-only day info) and warmth-ranked top-3 reviewers, all from `open_events` accruing since v1.10 · **theme-matched scrollbars** (each theme its own custom pair, library of 8 kept as a bench) · **2×2 theme picker** with per-theme paper swatch chips + stamped selection · offline `/continue`, first-run hydration state, honest failed-upload badge, no-store notes state · **sync test harness** (in-memory IndexedDB mock → 9 behavior tests over the real outbox/pull code) · **cleanup pass**: dead code/CSS swept, **lint driven to zero** for the first time. Second Fable-reviewed release (caught a data-loss clear-guard hole). 131 tests.

## ~~Next major — full local-first offline~~ — SHIPPED v2.0
The route doc `local-first-upgrade-path.md` describes the shipped architecture. The "never disappears" promise is enforced by design: ordered never-drop outbox, keep-both conflicts, guarded clears, revision-history backstop.

## Near-term — the shelf is empty
_Everything on the v2.1 backlog shipped. Repaso is now feature-complete for a single user. Shawn tests real-world performance before deciding on anything further._

## Design polish (post-ship, only if wanted)
- **Overhaul the Settings page** — the page runs long with a lot of wasted vertical space (surfaced 2026-07-18 while taking README screenshots; it needed two shots to capture). Tighten the layout so Appearance / Offline storage / Your data / Account read as a denser, more deliberate page rather than three tall stacked panels. Keep it in the paper language, no dashboard-card slop.

## v2.1 final-review backlog (small, post-ship, only if wanted)
- **Local export of unbacked files** — a "download all files that couldn't back up" affordance, fully closing the failed-upload class (v2.1 surfaces + guards them; this would let you recover the content without the original on disk).
- **Guard-branch harness test** — pin the new `uploadFailed` clear-guard with the in-memory mock (~5 lines).
- **Clear-guard copy asymmetry** — with only `open` events queued, the desk pill says nothing but re-download refuses "waiting to back up"; cosmetic.
- **Save from a URL** (parked since v1.11) — paste a link instead of HTML.
- **More themes / custom-accent picker** — the picker now shows real palettes; adding themes or a custom accent is a natural extension.

## Settings-bundle status — COMPLETE
- ~~Bulk actions~~ (v1.10) · ~~Duplicate~~ (v1.10) · ~~Themes~~ (v1.8) · ~~Offline storage readout~~ (v1.10) · ~~**Study stats / streaks**~~ (**SHIPPED v2.1** — the last one). The whole Settings bundle is done.

## Upload makeover — SHIPPED v1.11
_All of Shawn's list landed: paste HTML, multi-file staging UX, preview, size display, confirmation step._
- Leftover thread: **save from a URL** (paste a link instead of HTML) — small, parked until wanted.
- ~~**v1.12 "Big files"**~~ — **SHIPPED 2026-07-16.** Next up: **v2.0 local-first** (own brainstorm). Note for the parked PDF/other-file-types idea: the old "4 MB makes PDFs awkward" objection is softer now (15 MB raw), though PDFs are binary, so they would ride the same encoding seam rather than the HTML pipeline.

## Scaling up (more users — bigger, foundations still uncertain)
_Parked until we actually decide to grow past single-user; requirements unknown today._
- **Save a shared reviewer to your own desk** — classmate sends a `/s/…` link → "Save to my Repaso." The real viral loop (share → save → sign up). (Shawn: good someday, feels huge now.)
- **Published shelf** — opt-in public gallery of reviewers you mark "published."
- **Classmate drop-box** — a link where classmates submit reviewers *to* you, into an approval queue.
- **Multi-user accounts / public app** (Route 5) — remove the allow-list, add sign-up, quotas, rate limiting.

## Parked (keep the thought, probably not soon)
- **Study timer / Pomodoro** (Shawn 2026-07-12: timers on things stress him out — leave it off).
- **Flashcard drill from notes** (reviewers already have quizzes; redundant).
- **Exam countdowns / +Add exam** (cut from the v1.5 shell; don't re-pitch in UI).
- **PDF / other file types** (moved from Rejected 2026-07-12 — Shawn: too useful to write off forever). The 4 MB per-file cap makes PDFs awkward today, but revisit: a viewer that handles PDF/images would broaden what a "reviewer" can be. Likely rides along with the **upload makeover** bundle.

## Rejected (with reason)
- **Annotations/highlights inside the reviewer file** — the iframe sandbox that protects uploaded HTML blocks injecting our UI into it. Notes drawer is the annotation surface.
- **In-app AI generation** — every call costs money server-side; breaks ₱0. Claude generates content free at build time instead.
- **Google Keep integration** — no public consumer API.
