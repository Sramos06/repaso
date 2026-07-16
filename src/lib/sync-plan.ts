// Pure decisions for the sync engine. No IndexedDB, no fetch, fully testable.
import type { LocalReviewer, ServerRow, QueuedMutation, ReviewerPatch } from "./local-types";

export function isLocalId(id: string): boolean {
  return id.startsWith("local-");
}

export function makeLocalId(): string {
  return `local-${crypto.randomUUID()}`;
}

export type PullPlan = { fetchIds: string[]; metaOnly: ServerRow[]; deleteIds: string[] };

// Content never changes after upload (replace-file was removed in v1.10), so
// only NEW ids need a content fetch; a changed updatedAt is metadata-only.
export function diffRows(server: ServerRow[], local: LocalReviewer[]): PullPlan {
  const localById = new Map(local.map((r) => [r.id, r]));
  const serverIds = new Set(server.map((r) => r.id));
  const fetchIds: string[] = [];
  const metaOnly: ServerRow[] = [];
  for (const s of server) {
    const l = localById.get(s.id);
    if (!l) fetchIds.push(s.id);
    else if (l.updatedAt !== s.updatedAt || l.hasNotes !== s.hasNotes || l.lastOpenedAt !== s.lastOpenedAt) metaOnly.push(s);
  }
  const deleteIds = local.filter((l) => !l.pending && !serverIds.has(l.id)).map((l) => l.id);
  return { fetchIds, metaOnly, deleteIds };
}

// Keep-both: never drop either side of a conflicted note.
export function mergeNote(serverText: string, localText: string, whenIso: string): string {
  if (!serverText.trim()) return localText;
  if (!localText.trim()) return serverText;
  const when = new Date(whenIso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  return `${serverText}\n\n--- Kept from this device (${when}) ---\n\n${localText}`;
}

export function backoffMs(attempts: number): number {
  return Math.min(1000 * 2 ** attempts, 60000);
}

export function remapMutations(list: QueuedMutation[], tempId: string, realId: string): QueuedMutation[] {
  return list.map((m) => {
    if (m.kind === "note" && m.target === tempId) return { ...m, target: realId };
    if ((m.kind === "patch" || m.kind === "delete" || m.kind === "open") && m.id === tempId) return { ...m, id: realId };
    return m;
  });
}

export function applyPatchLocal(row: LocalReviewer, patch: ReviewerPatch, nowIso: string): LocalReviewer {
  const out: LocalReviewer = { ...row, updatedAt: nowIso };
  if (patch.title !== undefined) out.title = patch.title;
  if (patch.subject !== undefined) out.subject = patch.subject;
  if (patch.pinned !== undefined) out.pinned = patch.pinned;
  if (patch.archived !== undefined) out.archivedAt = patch.archived ? nowIso : null;
  return out;
}
