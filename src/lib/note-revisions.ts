// Snapshot policy for notes history. Pure — the DB side lives in note-snapshot.ts.
// Policy (spec v1.9): snapshot the PREVIOUS text when a save changes it,
// at most one snapshot per 10-minute window, never snapshot emptiness,
// keep the newest 30 per note.
export const REVISION_WINDOW_MS = 600_000; // 10 minutes
export const MAX_REVISIONS = 30;

export function shouldSnapshot(prev: string, next: string, lastRevisionAt: Date | null, now: Date): boolean {
  if (prev === "" || prev === next) return false;
  if (lastRevisionAt === null) return true;
  return now.getTime() - lastRevisionAt.getTime() >= REVISION_WINDOW_MS;
}
