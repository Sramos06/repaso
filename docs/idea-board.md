# Repaso Idea Board

Running list of feature ideas. Status: **picked** (next round), **candidate** (liked, unscheduled), **parked** (probably not, keep the thought), **rejected** (decided against, with reason).

_Last updated: 2026-07-12 (post-v1.6 ship)._

## Shipped
- **v1.5** (2026-07-11): search desk, pins, rename/delete, export, logout, focus viewer, offline tier.
- **v1.6** (2026-07-12): **Archive shelf** (⋯ Archive → "In the drawer" section, searchable, never deleted) · **Share link** (private revocable `/s/<token>` capability URL, app-branded, nothing else public) · **Import / Restore** (load a `repaso-backup-*.json`; export bumped to v2 with pin/archive) · **Content search** (desk search also matches text *inside* reviewer HTML; results still just cards, "found inside" badge, viewer untouched).

## Candidates (liked in discussion, not yet picked)
- **Download the .html file** (Shawn 2026-07-12) — a Download action that saves the original single-file HTML back to the device, in TWO places: (1) in the app (⋯ menu or the viewer) for yourself, (2) on the public `/s/<token>` share page so recipients can save their own copy. Trivial: we already hold `htmlContent` → Blob download.
- **"Available offline" indicator** (Shawn 2026-07-12) — a per-card badge showing a reviewer is cached and openable offline (query the SW cache with `caches.match('/api/reviewers/<id>')` from the page). Plus an app-level online/offline banner and a settings readout of what's cached. Pairs with a manual **"Make available offline"** action that force-caches a reviewer you haven't opened yet.
- **Offline behaviour audit** (Shawn 2026-07-12, verification not feature) — Shawn is unsure offline actually works. Current SW (`public/sw.js`) = network-first + cache fallback: caches the app shell + pages you've visited + reviewers you've OPENED while online; a never-opened reviewer is NOT available offline; uploads/rename/delete/pin/archive/search/share need a connection; notes edited offline keep a localStorage draft and resync on reconnect. The indicator above is what makes this legible.
- **Replace file (keep notes)** — ⋯ menu action to swap a reviewer's HTML with an updated version without duplicating the card or orphaning notes.
- **Published shelf (opt-in public gallery)** — a public page listing ONLY reviewers explicitly marked "published" — the promotional variant of sharing. Per-reviewer opt-in; everything else stays private.
- **Exam reading mode (wake lock)** — while a reviewer is open, keep the phone screen awake (Screen Wake Lock API). Tiny feature, big for long reading sessions.
- **Study stats / streaks** — track time-per-reviewer and show a GitHub-style heatmap ("STAT 023: 2h this week"). Data already half-exists (lastOpenedAt).
- **Notes → printable sheet** — export a reviewer's notes (or all notes for a subject) as a clean print/PDF page for offline cramming.
- **PWA app shortcuts** — long-press the app icon → "Scratchpad" / "Last opened" (manifest `shortcuts`, near-zero effort).
- **Notes version history** — keep prior versions of a note; undo an accidental overwrite.
- **Classmate drop-box** — a special link where classmates can *submit* a reviewer TO you; it lands in an approval queue, not directly on the desk (size-capped, validated like normal uploads).

## Parked
- **Flashcard drill from notes** (Shawn 2026-07-11: reviewers already contain quizzes; feels redundant — keep the thought, probably unused).
- **Exam countdowns / +Add exam** (cut from the v1.5 shell by Shawn; don't re-pitch in UI).
- **Themes / settings screen** (Aral + STUDYO prototypes ready; Shawn: only after all wanted features exist).
- **Full local-first offline** — documented route in `local-first-upgrade-path.md`; waits until the easy tier feels limiting.
- **Multi-user / public app (Route 5)** — explicitly not yet.

## Rejected (with reason)
- **Annotations/highlights inside the reviewer file** — the iframe sandbox that keeps uploaded HTML from touching the app also blocks injecting our UI into the file. Working as intended; notes drawer is the annotation surface.
- **PDF/other file types** — 4 MB per-file cap makes PDFs awkward; single-file HTML remains the better format for how the reviewers are made.
- **In-app AI generation (quizzes/summaries)** — breaks the ₱0 rule (every API call costs money server-side); Claude already generates reviewer content for free at build time instead.
- **Google Keep integration** — no public consumer API.
