// Decides whether a guarded note save must be rejected so the client can
// keep-both. Absent base = legacy unguarded write (restore flow, old clients).
export function noteConflict(
  existingUpdatedAt: Date | null,
  existingContent: string,
  base: string | null | undefined
): boolean {
  if (base === undefined) return false;
  if (base === null) return existingContent.trim().length > 0;
  const baseMs = Date.parse(base);
  if (Number.isNaN(baseMs)) return false; // malformed guard: fail open, revisions still backstop
  if (!existingUpdatedAt) return false;
  return existingUpdatedAt.getTime() > baseMs;
}
