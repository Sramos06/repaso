# Repaso Idea Board

Running list of feature ideas, grouped by *when/how* they should be built, not just liked/disliked.

_Last updated: 2026-07-14 (post-v1.10 ship)._

## Shipped
- **v1.5** (2026-07-11): search desk, pins, rename/delete, export, logout, focus viewer, offline tier.
- **v1.6** (2026-07-12): archive shelf · private share links (`/s/<token>`) · import/restore (export v2) · content search ("found inside").
- **v1.7** (2026-07-12): continue-studying row · command palette · search snippets · download .html · offline reading of every reviewer.
- **v1.8** (2026-07-13): **Settings page** (`/settings`) · four themes (warm/night/coffee/matcha, synced + no-flash) · export/import moved into Settings. **The Settings surface now EXISTS** — the bundle below is unblocked.
- **v1.9** (2026-07-14): mobile avatar-menu fix · replace file (keeps notes/link) · **notes version history** (snapshot on save, restore) · printable notes sheet · PWA shortcuts + `/continue` · automatic wake-lock. The near-term shelf is now EMPTY.
- **v1.10** (2026-07-14): five-item ⋯ menu (Rename/Duplicate/Send/Archive/Delete) with **Send sheet** · replace-file removed (Shawn's call) · **manage mode** (bulk archive/export/delete) · **duplicate** · **offline storage readout** in Settings · `open_events` accruing for future stats · UI copy fully em-dash free. Settings-bundle DONE except the stats screen itself.

## Next major — full local-first offline (promoted 2026-07-12)
**Why it moved up:** PUP often has no internet and Shawn's data signal is slow/unreliable — reading (and ideally editing) reviewers offline is a real need, not a nice-to-have.
**Why it's its own dedicated version, not bundled:** true offline = a sync engine + conflict resolution, which is exactly where data-loss bugs hide (we already spent 3 review rounds on notes-autosave races in v1.5; full sync is that, for everything). It gets its own brainstorm + spec + careful TDD, not a rushed add-on. This is Shawn's precious "never disappears" data.
**Sequencing:** v1.7 ships the cheap, low-risk stepping stone — **all reviewers *readable* offline** (precache every reviewer's content, not just opened ones). This version then adds true offline *editing/uploads* + the sync engine: IndexedDB as source of truth, a mutation queue with per-row `updatedAt` version stamps, push-when-online, conflict = keep-both-never-drop. Route doc: `local-first-upgrade-path.md`.

## Near-term — standalone, buildable now (no new host surface needed)
_Empty — everything on this shelf shipped in v1.7 (continue-studying, palette, snippets, download, offline reading) and v1.9 (replace-file, shortcuts, wake-lock, notes history, notes→print). New small ideas land here._

## Settings-bundle status (post-v1.10)
- ~~**Bulk actions**~~ — **SHIPPED v1.10** (manage mode on the desk with Select + bottom bar).
- ~~**Duplicate a reviewer**~~ — **SHIPPED v1.10.**
- ~~**Themes / appearance**~~ — **SHIPPED v1.8.** Unpicked ideas remain: more themes, a custom-accent picker.
- ~~**Offline storage readout**~~ — **SHIPPED v1.10.**
- **Study stats / streaks** — the last one standing. `open_events` has been accruing since v1.10, so whenever this gets built it starts with real history. Time-per-reviewer, GitHub-style heatmap, a profile-ish home.

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
- **PDF / other file types** (moved from Rejected 2026-07-12 — Shawn: too useful to write off forever). The 4 MB per-file cap makes PDFs awkward today, but revisit: a viewer that handles PDF/images would broaden what a "reviewer" can be. Likely rides along with the **upload makeover** bundle.

## Rejected (with reason)
- **Annotations/highlights inside the reviewer file** — the iframe sandbox that protects uploaded HTML blocks injecting our UI into it. Notes drawer is the annotation surface.
- **In-app AI generation** — every call costs money server-side; breaks ₱0. Claude generates content free at build time instead.
- **Google Keep integration** — no public consumer API.
