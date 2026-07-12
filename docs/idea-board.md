# Repaso Idea Board

Running list of feature ideas, grouped by *when/how* they should be built, not just liked/disliked.

_Last updated: 2026-07-12 (post-v1.6, triage with Shawn)._

## Shipped
- **v1.5** (2026-07-11): search desk, pins, rename/delete, export, logout, focus viewer, offline tier.
- **v1.6** (2026-07-12): archive shelf · private share links (`/s/<token>`) · import/restore (export v2) · content search ("found inside").

## Near-term — standalone, buildable now (no new host surface needed)
- **Continue studying row** — a strip at the top of the desk with your last few opened reviewers. Uses `lastOpenedAt`, already tracked. (Shawn: yes.)
- **Command palette / quick jump** — key to focus search + jump to any reviewer by name without scrolling. (Shawn: yes.)
- **Search snippets** — content-search results show the sentence the match is in, with the word highlighted (escaped — content is search-only). Upgrades "found inside" to "found inside, *here*." (Shawn: yes.)
- **Download the .html file** (Shawn 2026-07-12) — save the original single-file HTML back to the device, in TWO places: (1) in the app (⋯ / viewer) for yourself, (2) on the public `/s/<token>` page so recipients keep a copy. Trivial: we hold `htmlContent` → Blob download.
- **"Available offline" indicator + "Make available offline"** (Shawn 2026-07-12) — per-card badge when a reviewer is cached (`caches.match('/api/reviewers/<id>')`); an app-level online/offline banner; and a manual action to force-cache a reviewer you haven't opened yet. Makes the existing offline tier *legible*.
- **Replace file (keep notes)** — ⋯ action to swap a reviewer's HTML for an updated version without duplicating the card or orphaning notes.
- **PWA app shortcuts** — long-press icon → "Scratchpad" / "Last opened" (manifest `shortcuts`, near-zero effort).
- **Wake-lock reading mode** — keep the screen awake while a reviewer is open (no timer). Small.
- **Notes version history** — undo an accidental note overwrite.
- **Notes → printable sheet** — print/PDF a reviewer's notes for offline cramming.

## Needs a home surface first → build a Settings / Profile / "manage mode" once, then these drop in together
_Shawn's point: piling more buttons on the desk gets overwhelming; these want their own section._
- **Bulk actions** — multi-select archive/delete/export (semester cleanup). (Shawn: good idea, but not on the desk — put it behind a manage/settings surface.)
- **Duplicate a reviewer** — clone to tweak.
- **Themes / appearance** — Aral + STUDYO prototypes ready; needs the settings surface to live in.
- **Offline storage readout** — what's cached, total size, "clear offline copies."
- **Study stats / streaks** — time-per-reviewer, GitHub-style heatmap; a profile-ish home.

## Upload makeover (future bundle — rethink the whole upload flow at once)
_Shawn has several ideas here; do them together as one considered pass, not piecemeal._
- **Paste HTML / quick capture** — save from pasted HTML (or a URL) instead of a file.
- **Multiple-file upload UX**, **upload preview**, **file-size display**, **confirmation step**, etc. (Shawn's own list.)

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
- **Full local-first offline** — documented route in `local-first-upgrade-path.md`; waits until the easy tier feels limiting.

## Rejected (with reason)
- **Annotations/highlights inside the reviewer file** — the iframe sandbox that protects uploaded HTML blocks injecting our UI into it. Notes drawer is the annotation surface.
- **PDF/other file types** — 4 MB per-file cap makes PDFs awkward; single-file HTML fits how the reviewers are made.
- **In-app AI generation** — every call costs money server-side; breaks ₱0. Claude generates content free at build time instead.
- **Google Keep integration** — no public consumer API.
