// src/lib/local-reviewers.ts
// The UI's only door to the local store: reads render from here, writes apply
// here first and enqueue their server mutation. No component touches local-db.
"use client";

import type { LocalReviewer, LocalNote, ReviewerPatch } from "./local-types";
import { makeLocalId, isLocalId, applyPatchLocal } from "./sync-plan";
import { dbGet, dbGetAll, dbPut, dbDel, notifyChange } from "./local-db";
import { enqueue } from "./outbox";
import { decodeContent, encodeContent, utf8Bytes } from "./content-codec";
import { validateUpload, MAX_BYTES, MAX_WIRE_BYTES, WIRE_LIMIT_REASON } from "./validate-upload";
import { copyTitle } from "./copy-title";

export async function getDeskRows(): Promise<LocalReviewer[]> {
  const rows = await dbGetAll<LocalReviewer>("reviewers");
  return rows.sort((a, b) => (a.pinned === b.pinned ? (a.createdAt < b.createdAt ? 1 : -1) : a.pinned ? -1 : 1));
}

// A temp id may have been adopted while this tab still holds the old URL.
export async function resolveId(id: string): Promise<string> {
  if (!isLocalId(id)) return id;
  const remap = await dbGet<{ key: string; value: string }>("meta", `remap:${id}`);
  return remap?.value ?? id;
}

export async function getContent(id: string): Promise<string | null> {
  const rid = await resolveId(id);
  const row = await dbGet<LocalReviewer>("reviewers", rid);
  if (row) return decodeContent(row.payload, row.encoding);
  // Not local yet (first minutes on a new device): fall through to the network.
  if (isLocalId(rid) || typeof navigator === "undefined" || !navigator.onLine) return null;
  try {
    const res = await fetch(`/api/reviewers/${rid}`);
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d.htmlContent === "string" ? decodeContent(d.htmlContent, d.encoding ?? "plain") : null;
  } catch { return null; }
}

export async function localPatch(id: string, patch: ReviewerPatch): Promise<void> {
  const rid = await resolveId(id);
  const row = await dbGet<LocalReviewer>("reviewers", rid);
  if (!row) return;
  await dbPut("reviewers", applyPatchLocal(row, patch, new Date().toISOString()));
  notifyChange();
  if (row.pending) return; // the upload carries current state; metadata patch would 404
  await enqueue({ kind: "patch", id: rid, patch });
}

export async function localDelete(id: string): Promise<void> {
  const rid = await resolveId(id);
  const row = await dbGet<LocalReviewer>("reviewers", rid);
  await dbDel("reviewers", rid);
  await dbDel("notes", rid);
  notifyChange();
  if (row?.pending) {
    // Never uploaded: cancel its queued mutations instead of deleting server-side.
    const pending = await dbGetAll<{ seq: number; kind: string; id?: string; tempId?: string; target?: string }>("outbox");
    for (const q of pending) {
      if (q.tempId === rid || q.id === rid || q.target === rid) await dbDel("outbox", q.seq);
    }
    notifyChange();
    return;
  }
  await enqueue({ kind: "delete", id: rid });
}

export async function localDuplicate(id: string): Promise<void> {
  const rid = await resolveId(id);
  const src = await dbGet<LocalReviewer>("reviewers", rid);
  if (!src) return;
  const now = new Date().toISOString();
  const dup: LocalReviewer = {
    ...src, id: makeLocalId(), title: copyTitle(src.title), pinned: false, archivedAt: null,
    lastOpenedAt: null, createdAt: now, updatedAt: now, hasNotes: false, pending: true,
  };
  await dbPut("reviewers", dup);
  notifyChange();
  await enqueue({ kind: "upload", tempId: dup.id, name: `${dup.title.replace(/[^\w\- ]+/g, "").trim() || "reviewer"}.html`, payload: dup.payload, encoding: dup.encoding });
}

// The one write path for new content (drop, paste, offline or online): local
// row now, queued upload next. Mirrors uploadOne's validation and reasons.
export async function localCreate(name: string, raw: string): Promise<{ ok: true; id: string; title: string } | { ok: false; reason: string }> {
  const rawBytes = utf8Bytes(raw);
  const check = validateUpload(name, rawBytes, raw);
  if (!check.ok) return { ok: false, reason: check.reason };
  if (rawBytes > MAX_BYTES) return { ok: false, reason: "File is over the 15 MB limit." };
  let payload: string, encoding: "plain" | "gzip";
  try { ({ payload, encoding } = await encodeContent(raw)); }
  catch { return { ok: false, reason: "Could not read this file. Try again." }; }
  if (utf8Bytes(payload) > MAX_WIRE_BYTES) {
    return { ok: false, reason: encoding === "gzip" ? WIRE_LIMIT_REASON : "Files over 4 MB need a browser that supports compression. Update your browser and try again." };
  }
  const now = new Date().toISOString();
  const row: LocalReviewer = {
    id: makeLocalId(), title: check.title, subject: null, pinned: false, archivedAt: null,
    createdAt: now, updatedAt: now, lastOpenedAt: null, sizeBytes: rawBytes,
    payload, encoding, hasNotes: false, pending: true,
  };
  await dbPut("reviewers", row);
  notifyChange();
  await enqueue({ kind: "upload", tempId: row.id, name, payload, encoding });
  return { ok: true, id: row.id, title: row.title };
}

export async function recordOpen(id: string): Promise<void> {
  const rid = await resolveId(id);
  const row = await dbGet<LocalReviewer>("reviewers", rid);
  if (row) {
    await dbPut("reviewers", { ...row, lastOpenedAt: new Date().toISOString() });
    notifyChange();
  }
  if (row && !row.pending) await enqueue({ kind: "open", id: rid });
}

export async function getLocalNote(target: string): Promise<LocalNote | null> {
  const t = await resolveId(target);
  return (await dbGet<LocalNote>("notes", t)) ?? null;
}

export async function saveNoteLocal(target: string, contentMd: string): Promise<void> {
  const t = await resolveId(target);
  const existing = await dbGet<LocalNote>("notes", t);
  await dbPut("notes", { key: t, contentMd, updatedAt: existing?.updatedAt ?? null, dirty: true } satisfies LocalNote);
  if (t !== "scratchpad") {
    const row = await dbGet<LocalReviewer>("reviewers", t);
    if (row && row.hasNotes !== contentMd.trim().length > 0) {
      await dbPut("reviewers", { ...row, hasNotes: contentMd.trim().length > 0 });
    }
  }
  notifyChange();
  // Notes on a still-pending reviewer enqueue normally: the outbox is ordered,
  // so the upload (earlier seq) flushes first and adoptRealId remaps this
  // entry's target to the real id before it is ever sent.
  await enqueue({ kind: "note", target: t, contentMd, baseUpdatedAt: existing?.updatedAt ?? null });
}
