// src/lib/sync.ts
// Pull side + lifecycle. Push side lives in outbox.ts; decisions in sync-plan.ts.
"use client";

import type { LocalReviewer, LocalNote, ServerRow } from "./local-types";
import { diffRows } from "./sync-plan";
import { dbGet, dbGetAll, dbPut, dbDel, dbClear, notifyChange } from "./local-db";
import { flushOutbox, outboxCount, pendingWorkCount } from "./outbox";

let started = false;
export function startSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", () => { void runSync(); });
  void runSync();
}

let syncing = false;
export async function runSync(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine || syncing) return;
  syncing = true;
  try {
    await flushOutbox();
    await pull();
  } finally {
    syncing = false;
  }
}

export async function isHydrated(): Promise<boolean> {
  return !!(await dbGet<{ key: string; value: string }>("meta", "hydratedAt"));
}

async function pull(): Promise<void> {
  let serverRows: ServerRow[];
  try {
    const res = await fetch("/api/reviewers");
    if (!res.ok) return; // signed out or server trouble: try again next kick
    serverRows = (await res.json()).reviewers ?? [];
  } catch { return; }

  const local = await dbGetAll<LocalReviewer>("reviewers");
  const plan = diffRows(serverRows, local);
  const metaById = new Map(serverRows.map((r) => [r.id, r]));

  // A retry-scheduled flush failure still falls through to pull: rows with a
  // queued mutation are ahead of the server and must not be overwritten here.
  // The next pull adopts server truth once that mutation confirms and leaves the outbox.
  const queued = await dbGetAll<{ kind: string; id?: string; target?: string; tempId?: string }>("outbox");
  const locallyAhead = new Set<string>();
  // A queued delete means the row is gone locally; re-fetching it would
  // resurrect what the user just deleted until the delete flushes.
  const locallyDeleted = new Set<string>();
  // Every id any queued mutation references, so a delete pulled mid-flight
  // can't remove a row (or its note) an in-flight upload/patch still owns.
  const queuedIds = new Set<string>();
  for (const q of queued) {
    if (q.kind === "patch" && q.id) locallyAhead.add(q.id);
    if (q.kind === "note" && q.target) locallyAhead.add(q.target);
    if (q.kind === "delete" && q.id) locallyDeleted.add(q.id);
    if (q.id) queuedIds.add(q.id);
    if (q.target) queuedIds.add(q.target);
    if (q.tempId) queuedIds.add(q.tempId);
  }

  await Promise.all(plan.fetchIds.map(async (id) => {
    if (locallyDeleted.has(id)) return;
    try {
      const res = await fetch(`/api/reviewers/${id}`);
      if (!res.ok) return;
      const d = await res.json();
      const s = metaById.get(id);
      if (!s || typeof d.htmlContent !== "string") return;
      if (typeof s.updatedAt !== "string") return; // guards a stale tab against a rolled-back server missing updatedAt
      await dbPut("reviewers", {
        ...s, payload: d.htmlContent, encoding: d.encoding ?? "plain", pending: false,
      } satisfies LocalReviewer);
    } catch { /* offline mid-pull: next runSync finishes the job */ }
  }));
  notifyChange(); // paint fetched content as soon as it lands, don't wait for notes below
  for (const s of plan.metaOnly) {
    if (locallyAhead.has(s.id)) continue; // this device is ahead of the server here; adopt after the flush lands
    if (typeof s.updatedAt !== "string") continue; // guards a stale tab against a rolled-back server missing updatedAt
    const row = await dbGet<LocalReviewer>("reviewers", s.id);
    if (row) await dbPut("reviewers", { ...row, ...s, payload: row.payload, encoding: row.encoding, pending: false });
  }
  for (const id of plan.deleteIds) {
    if (queuedIds.has(id)) continue; // an in-flight mutation still references this row; next pull settles it
    await dbDel("reviewers", id);
    await dbDel("notes", id);
  }

  // Notes: adopt the server copy unless this device has unconfirmed text.
  try {
    const res = await fetch("/api/notes/all");
    if (res.ok) {
      const all: { reviewerId: string | null; contentMd: string; updatedAt: string }[] = (await res.json()).notes ?? [];
      for (const n of all) {
        const key = n.reviewerId ?? "scratchpad";
        if (locallyDeleted.has(key)) continue; // its reviewer is deletion-pending; don't re-adopt the note
        const localNote = await dbGet<LocalNote>("notes", key);
        if (localNote?.dirty) continue; // outbox will reconcile (keep-both on conflict)
        await dbPut("notes", { key, contentMd: n.contentMd, updatedAt: n.updatedAt, dirty: false } satisfies LocalNote);
      }
    }
  } catch { /* same: next kick */ }

  await dbPut("meta", { key: "hydratedAt", value: new Date().toISOString() });
  notifyChange();
}

// Settings action. Refuses while anything is waiting to back up: clearing
// the local store must never eat unsynced work.
export async function clearLocalAndRehydrate(): Promise<{ ok: boolean; reason?: string }> {
  if ((await outboxCount()) > 0) return { ok: false, reason: "You have changes waiting to back up. Go online first, then try again." };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, reason: "You're offline. Clearing now would leave nothing to read." };
  await dbClear("reviewers");
  await dbClear("notes");
  await dbDel("meta", "hydratedAt");
  notifyChange();
  await runSync();
  return { ok: true };
}

export { pendingWorkCount };
