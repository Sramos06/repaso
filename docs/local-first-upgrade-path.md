# Offline: what Repaso does today, and the full local-first upgrade path

## Today (v1.5 — "easy tier")

- **Service worker** (`public/sw.js`): network-first with cache fallback.
  Every reviewer you open while online is cached; offline, the desk and any
  previously-opened reviewer still load. Auth routes and all writes bypass
  the cache entirely.
- **Notes**: every keystroke is mirrored to localStorage. If a save fails,
  the badge shows "KEPT LOCALLY — will sync" and the draft re-syncs on the
  browser `online` event or next open. Neon remains the source of truth.

Limits of the easy tier (accepted on purpose):
- A reviewer never opened on this device is not available offline.
- Uploads, renames, deletes and pins need a connection.
- Notes written offline on two devices at once resolve last-write-wins.

## Future: full local-first (the real upgrade, when wanted)

Goal: the device's copy is the primary copy; the cloud becomes a sync target.

1. **Storage**: move reviewer HTML + notes into IndexedDB (via the `idb`
   wrapper or Dexie). Everything opens instantly from disk, online or not.
2. **Sync engine**: a background queue of mutations (upload/rename/delete/
   pin/note-write) with per-row `updatedAt` version stamps; push when online,
   pull on app open, retry with backoff.
3. **Conflicts**: single-user + per-reviewer notes means last-write-wins per
   field is acceptable; keep a "conflicted copy" note row if both sides
   changed since the last sync, never silently drop text.
4. **Uploads offline**: write to IndexedDB immediately (visible on the desk),
   flag "not backed up yet", push when online.
5. **Migration**: on first run of the local-first build, hydrate IndexedDB
   from `/api/export` + per-reviewer fetches (the same path the backup
   button uses). No server changes required to start.

The v1.5 architecture was shaped so this slots in cleanly: all mutations go
through a handful of `fetch` call sites (`DeskClient.call`, `UploadZone.send`,
`NotesPanel.save`) which are exactly the seams a sync queue would wrap.
