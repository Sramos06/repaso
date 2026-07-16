# Offline: Repaso is local-first (shipped in v2.0)

The device's copy is the primary copy; the cloud (Neon) is the sync target,
the backup-of-record, and the bridge between devices. This replaced the
v1.5-v1.7 "easy tier" (SW content caching + localStorage note drafts).

## The pieces

- **Local store** (`src/lib/local-db.ts`): IndexedDB `repaso-local`, four
  stores: `reviewers` (full desk metadata + v1.12 compressed `{payload,
  encoding}` content + `pending` flag), `notes` (`{contentMd, updatedAt,
  dirty}`), `outbox` (queued mutations), `meta` (hydration stamp, id remaps).
- **Pure decisions** (`src/lib/sync-plan.ts`, tested): list diffing
  (content is immutable after upload, so changed rows are metadata-only;
  pending rows are protected), keep-both note merging, retry backoff,
  temp-id remapping.
- **Outbox** (`src/lib/outbox.ts`): every write applies locally first, then
  queues one of `note` / `patch` / `delete` / `upload` / `open`. One tab
  flushes at a time (Web Lock), strictly in order; entries leave the queue
  only on server confirmation (or a permanent 400/404 verdict). Offline
  uploads get a temp `local-<uuid>` id; on confirmation the real id is
  adopted everywhere (meta remap record first, so a crash resumes instead
  of re-uploading).
- **Conflicts**: note saves carry `baseUpdatedAt`; the server 409s with its
  copy when another device saved first; the client keeps BOTH texts and
  notifies. Identical texts resolve quietly as confirmations. The v1.9
  revision history remains the deep backstop.
- **Pull** (`src/lib/sync.ts`): on app open and reconnect, flush then pull:
  diff the upgraded list endpoint, fetch new content in parallel, adopt
  server notes unless locally dirty, skip rows with queued local changes.
- **UI door** (`src/lib/local-reviewers.ts`): the only module components
  import. `BroadcastChannel` keeps every open tab live.
- **Service worker** (`public/sw.js`, v4): shell duty only. Pages and static
  assets cache network-first; any cached `/viewer/*` page serves as the app
  shell for any id (the client resolves the id from the URL). All `/api/*`
  traffic is untouched.

## Guarantees

- Reading, writing notes, uploading, and organizing all work offline; the
  outbox sends everything when a connection returns.
- Clearing local storage from Settings refuses while anything is waiting to
  back up. Export backups stay cloud-based raw HTML (backup-v2).
- Rollback safety: the cloud endpoints are unchanged in meaning; the outbox
  only ever adds through the same validated APIs.
