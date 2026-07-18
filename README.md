# Repaso

Repaso is my personal study app. I make single-file HTML reviewers (usually with an AI, one per subject), upload them here, and open them from any device with one tap. Every reviewer stays in the cloud so nothing gets lost, and each one has its own notes drawer for margin notes while I study.

It is built to run at **zero cost, forever**, on free tiers only, with no card on file anywhere. It signs in once per device with Google and only my account is allowed in.

**Live:** [repaso-six.vercel.app](https://repaso-six.vercel.app) (single-user, allow-listed)

## What it does

- **Upload reviewers** by dropping `.html` files or pasting HTML directly. Files up to 15 MB, stored compressed so they stay small.
- **Open anywhere** as an installed app on phone or laptop. The reviewer fills the screen in a sandboxed frame, so any quizzes or interactivity inside it still work.
- **Notes** on every reviewer plus a global scratchpad, with a written/preview toggle, version history, and a printable sheet.
- **Local-first.** The whole app works with no internet: read reviewers, write notes, upload new ones, rename, pin, archive, delete. Everything backs up to the cloud on its own once a connection returns. This matters because I do not always have signal at school.
- **Organize** with search (including search inside a reviewer's text), pins, subjects, an archive drawer, and bulk actions.
- **Share** a single reviewer with a private link that anyone can open read-only, no sign-in, and that I can turn off anytime.
- **Study stats.** A study record with streaks, days studied, a year calendar of when I opened things, and my most-visited reviewers.
- **Themes.** Four looks (Warm Paper, Night Library, Coffee, Matcha) that sync to my account, each with its own matching custom scrollbars.
- **Backups.** Export everything to one JSON file and restore from it later. The backup is plain readable HTML, so it never depends on the app to open.

## Stack

- **Next.js** (App Router) and **TypeScript**
- **Neon** Postgres with **Drizzle ORM**
- **Auth.js** with Google sign-in
- **Vercel** for hosting (auto-deploys on push to `main`)
- Installable **PWA** with an offline service worker

Everything sits on a no-card free tier. This was picked on purpose over options that need a card or pause the database.

## How the offline part works

The device is the source of truth. Every reviewer and note lives in the browser's IndexedDB, so the desk, viewer, and notes all open instantly whether or not there is a connection. Writes apply to the local copy first, then join an ordered outbox queue that pushes them to Neon whenever the network is available. The cloud is the backup and the bridge between my phone and laptop. If two devices ever edit the same note, both versions are kept rather than one being dropped. The full write-up is in [`docs/local-first-upgrade-path.md`](docs/local-first-upgrade-path.md).

## Running it yourself

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Before running, copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL` — a Neon Postgres connection string
- `AUTH_SECRET` — any random secret for Auth.js
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` — a Google OAuth client
- `ALLOWED_EMAIL` — the one email allowed to sign in

Useful scripts:

```bash
npm run test    # run the test suite
npm run lint    # lint
npm run build   # production build
```

App icons regenerate from inline SVGs in one pass:

```bash
node scripts/make-icons.mjs
```

## How it was built

Repaso grew one version at a time, from a first working upload-and-view app to a full local-first study tool. Each version started as a written spec and plan, got built and reviewed piece by piece, and shipped only after passing a full review. The design language is a warm paper desk: ruled index cards, washi tape, stamps, and handwritten margin notes, kept consistent across every screen.

## Screenshots

_Coming soon._
