const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(raw: string): boolean {
  return UUID.test(raw);
}

export function resolveNoteTarget(raw: string | null): { reviewerId: string | null } | { error: string } {
  if (raw === null || raw === "scratchpad") return { reviewerId: null };
  if (UUID.test(raw)) return { reviewerId: raw };
  return { error: "Invalid reviewer id." };
}
