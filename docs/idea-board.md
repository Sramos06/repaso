# Repaso Idea Board

Running list of feature ideas. Status: **picked** (next round), **candidate** (liked, unscheduled), **parked** (probably not, keep the thought), **rejected** (decided against, with reason).

_Last updated: 2026-07-11 (post-v1.5 ship)._

## Picked — v1.6 shortlist (pending final go)
- **Archive shelf** — "Archive" on the ⋯ menu tucks old reviewers into a drawer off the desk; still searchable, never deleted. Keeps the desk feeling like the current semester.
- **Share link (private, per-reviewer)** — generate a secret, revocable read-only link for one reviewer. Recipient opens it on the Repaso domain (app-branded, no account needed). Nothing else becomes public; default stays private.
- **Import / Restore** — load an exported `repaso-backup-*.json` back in (new-laptop migration ~Aug 2026 is the driver). Completes the Export loop.
- **Content search** — desk search also matches text *inside* reviewer HTML (Postgres full-text). Desk-only change: results are still just cards; the viewer is untouched.

## Candidates (liked in discussion, not yet picked)
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
