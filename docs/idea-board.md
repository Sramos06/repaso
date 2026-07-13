# Repaso Idea Board

Running list of feature ideas, grouped by *when/how* they should be built, not just liked/disliked.

_Last updated: 2026-07-13 (post-v1.8 ship)._

## Shipped
- **v1.5** (2026-07-11): search desk, pins, rename/delete, export, logout, focus viewer, offline tier.
- **v1.6** (2026-07-12): archive shelf · private share links (`/s/<token>`) · import/restore (export v2) · content search ("found inside").
- **v1.7** (2026-07-12): continue-studying row · command palette · search snippets · download .html · offline reading of every reviewer.
- **v1.8** (2026-07-13): **Settings page** (`/settings`) · four themes (warm/night/coffee/matcha, synced + no-flash) · export/import moved into Settings. **The Settings surface now EXISTS** — the bundle below is unblocked.

## Next major — full local-first offline (promoted 2026-07-12)
**Why it moved up:** PUP often has no internet and Shawn's data signal is slow/unreliable — reading (and ideally editing) reviewers offline is a real need, not a nice-to-have.
**Why it's its own dedicated version, not bundled:** true offline = a sync engine + conflict resolution, which is exactly where data-loss bugs hide (we already spent 3 review rounds on notes-autosave races in v1.5; full sync is that, for everything). It gets its own brainstorm + spec + careful TDD, not a rushed add-on. This is Shawn's precious "never disappears" data.
**Sequencing:** v1.7 ships the cheap, low-risk stepping stone — **all reviewers *readable* offline** (precache every reviewer's content, not just opened ones). This version then adds true offline *editing/uploads* + the sync engine: IndexedDB as source of truth, a mutation queue with per-row `updatedAt` version stamps, push-when-online, conflict = keep-both-never-drop. Route doc: `local-first-upgrade-path.md`.

## Near-term — standalone, buildable now (no new host surface needed)
- **Continue studying row** — a strip at the top of the desk with your last few opened reviewers. Uses `lastOpenedAt`, already tracked. (Shawn: yes.)
- **Command palette / quick jump** — key to focus search + jump to any reviewer by name without scrolling. (Shawn: yes.)
- **Search snippets** — content-search results show the sentence the match is in, with the word highlighted (escaped — content is search-only). Upgrades "found inside" to "found inside, *here*." (Shawn: yes.)
- **Download the .html file** (Shawn 2026-07-12) — save the original single-file HTML back to the device, in TWO places: (1) in the app (⋯ / viewer) for yourself, (2) on the public `/s/<token>` page so recipients keep a copy. Trivial: we hold `htmlContent` → Blob download.
- **Everything readable offline + "available offline" indicator** (Shawn 2026-07-12) — v1.7 approach: **precache every reviewer's content on app load** (while online) so all of them — not just opened ones — open offline. Per-card badge reflects cache state (`caches.match('/api/reviewers/<id>')`); app-level online/offline banner. This is the low-risk stepping stone toward the full local-first version above; it solves offline *reading* (the actual PUP pain) without the sync-engine rewrite.
- **Replace file (keep notes)** — ⋯ action to swap a reviewer's HTML for an updated version without duplicating the card or orphaning notes.
- **PWA app shortcuts** — long-press icon → "Scratchpad" / "Last opened" (manifest `shortcuts`, near-zero effort).
- **Wake-lock reading mode** — keep the screen awake while a reviewer is open (no timer). Small.
- **Notes version history** — undo an accidental note overwrite.
- **Notes → printable sheet** — print/PDF a reviewer's notes for offline cramming.

## Settings surface EXISTS (v1.8) → these now drop straight into `/settings`
_The home surface is built. These were blocked on it; they're now near-term._
- **Bulk actions** — multi-select archive/delete/export (semester cleanup). (Shawn: not on the desk — behind the settings/manage surface.)
- **Duplicate a reviewer** — clone to tweak.
- ~~**Themes / appearance**~~ — **SHIPPED v1.8** (warm/night/coffee/matcha). Unpicked ideas remain: more themes, a custom-accent picker.
- **Offline storage readout** — what's cached, total size, "clear offline copies." (Natural pair with the full local-first version.)
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
- **PDF / other file types** (moved from Rejected 2026-07-12 — Shawn: too useful to write off forever). The 4 MB per-file cap makes PDFs awkward today, but revisit: a viewer that handles PDF/images would broaden what a "reviewer" can be. Likely rides along with the **upload makeover** bundle.

## Rejected (with reason)
- **Annotations/highlights inside the reviewer file** — the iframe sandbox that protects uploaded HTML blocks injecting our UI into it. Notes drawer is the annotation surface.
- **In-app AI generation** — every call costs money server-side; breaks ₱0. Claude generates content free at build time instead.
- **Google Keep integration** — no public consumer API.
