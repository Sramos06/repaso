// src/lib/outbox.ts
// Ordered mutation queue: apply-locally-first callers enqueue here; one tab at
// a time (Web Lock) pushes to the server in seq order. Entries are removed
// ONLY on server confirmation, or on a permanent 400/404 verdict (invalid
// mutation must not poison the queue). Network/5xx failures retry with backoff.
"use client";

import type { Mutation, QueuedMutation, LocalNote, LocalReviewer } from "./local-types";
import { remapMutations, mergeNote, backoffMs } from "./sync-plan";
import { dbAdd, dbDel, dbGet, dbGetAll, dbPut, notifyChange } from "./local-db";

export async function outboxCount(): Promise<number> {
  return (await dbGetAll<QueuedMutation>("outbox")).length;
}

export async function enqueue(m: Mutation): Promise<void> {
  if (m.kind === "note") {
    // One pending save per note: the newest text supersedes any queued one.
    const pending = await dbGetAll<QueuedMutation>("outbox");
    for (const q of pending) if (q.kind === "note" && q.target === m.target) await dbDel("outbox", q.seq);
  }
  await dbAdd("outbox", { ...m, attempts: 0 });
  notifyChange();
  scheduleFlush(0);
}

let flushTimer: ReturnType<typeof setTimeout> | undefined;
export function scheduleFlush(delayMs = 0): void {
  clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { void flushOutbox(); }, delayMs);
}

// One flusher across all tabs. ifAvailable: if another tab holds the lock it
// is already flushing; this tab simply skips.
export async function flushOutbox(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.onLine) return;
  if (!("locks" in navigator)) { await flushLoop(); return; } // very old browser: single-tab assumption
  await navigator.locks.request("repaso-outbox", { ifAvailable: true }, async (lock) => {
    if (lock) await flushLoop();
  });
}

type SendResult = { status: "done" } | { status: "retry" } | { status: "drop" } | { status: "conflict"; contentMd: string; updatedAt: string };

async function flushLoop(): Promise<void> {
  for (;;) {
    const all = (await dbGetAll<QueuedMutation>("outbox")).sort((a, b) => a.seq - b.seq);
    const m = all[0];
    if (!m) return;
    let result: SendResult;
    try {
      result = await send(m);
    } catch {
      result = { status: "retry" }; // network died mid-flight
    }
    if (result.status === "done") {
      await dbDel("outbox", m.seq);
      notifyChange();
      continue;
    }
    if (result.status === "drop") {
      await dbDel("outbox", m.seq);
      notifyChange();
      continue;
    }
    if (result.status === "conflict" && m.kind === "note") {
      await resolveNoteConflict(m, result.contentMd, result.updatedAt);
      continue; // the replacement entry flushes on the next loop pass
    }
    // retry: bump attempts, keep the entry, come back later
    await dbPut("outbox", { ...m, attempts: m.attempts + 1 });
    scheduleFlush(backoffMs(m.attempts + 1));
    return;
  }
}

async function send(m: QueuedMutation): Promise<SendResult> {
  if (m.kind === "note") {
    const res = await fetch("/api/notes", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewerId: m.target === "scratchpad" ? "scratchpad" : m.target, contentMd: m.contentMd, baseUpdatedAt: m.baseUpdatedAt }),
    });
    if (res.status === 409) { const d = await res.json(); return { status: "conflict", contentMd: d.contentMd ?? "", updatedAt: d.updatedAt ?? new Date().toISOString() }; }
    if (res.ok) {
      const d = await res.json().catch(() => null);
      await adoptNoteStamp(m.target, m.contentMd, d?.updatedAt ?? null);
      return { status: "done" };
    }
    return res.status === 400 || res.status === 404 ? { status: "drop" } : { status: "retry" };
  }
  if (m.kind === "patch") {
    const res = await fetch(`/api/reviewers/${m.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(m.patch),
    });
    return res.ok ? { status: "done" } : res.status === 400 || res.status === 404 ? { status: "drop" } : { status: "retry" };
  }
  if (m.kind === "delete") {
    const res = await fetch(`/api/reviewers/${m.id}`, { method: "DELETE" });
    // 404 = already gone (e.g. deleted from the other device): that IS success.
    return res.ok || res.status === 404 ? { status: "done" } : res.status === 400 ? { status: "drop" } : { status: "retry" };
  }
  if (m.kind === "open") {
    const res = await fetch(`/api/reviewers/${m.id}/open`, { method: "POST" });
    return res.ok || res.status === 404 ? { status: "done" } : { status: "retry" };
  }
  // upload
  const res = await fetch("/api/reviewers", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: m.name, encoding: m.encoding, payload: m.payload }),
  });
  if (res.ok) {
    const d = await res.json().catch(() => null);
    const realId = d?.created?.[0]?.id;
    if (typeof realId === "string") await adoptRealId(m.tempId, realId);
    return { status: "done" };
  }
  return res.status === 400 ? { status: "drop" } : { status: "retry" };
}

// After a confirmed save: record the server stamp; clear dirty ONLY if the
// local text still matches what was confirmed (the user may have typed since).
async function adoptNoteStamp(target: string, savedText: string, updatedAt: string | null): Promise<void> {
  const note = await dbGet<LocalNote>("notes", target);
  if (!note) return;
  await dbPut("notes", { ...note, updatedAt, dirty: note.contentMd !== savedText ? note.dirty : false });
  notifyChange();
}

// After a merged conflict: keep both texts locally and requeue with the fresh base.
async function resolveNoteConflict(m: QueuedMutation & { kind: "note" }, serverText: string, serverUpdatedAt: string): Promise<void> {
  const note = await dbGet<LocalNote>("notes", m.target);
  const localText = note?.contentMd ?? m.contentMd;
  const merged = mergeNote(serverText, localText, new Date().toISOString());
  await dbPut("notes", { key: m.target, contentMd: merged, updatedAt: serverUpdatedAt, dirty: true } satisfies LocalNote);
  await dbDel("outbox", m.seq);
  await dbAdd("outbox", { kind: "note", target: m.target, contentMd: merged, baseUpdatedAt: serverUpdatedAt, attempts: 0 });
  notifyChange({ type: "note-merged", target: m.target });
}

// After a confirmed upload: the row becomes real everywhere the temp id lived.
async function adoptRealId(tempId: string, realId: string): Promise<void> {
  const row = await dbGet<LocalReviewer>("reviewers", tempId);
  if (row) {
    await dbDel("reviewers", tempId);
    await dbPut("reviewers", { ...row, id: realId, pending: false });
  }
  const note = await dbGet<LocalNote>("notes", tempId);
  if (note) {
    await dbDel("notes", tempId);
    await dbPut("notes", { ...note, key: realId });
  }
  const pending = await dbGetAll<QueuedMutation>("outbox");
  const remapped = remapMutations(pending, tempId, realId);
  for (let i = 0; i < pending.length; i++) {
    if (remapped[i] !== pending[i]) await dbPut("outbox", remapped[i]);
  }
  await dbPut("meta", { key: `remap:${tempId}`, value: realId });
  notifyChange();
}
