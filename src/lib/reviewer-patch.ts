export type ReviewerPatch = { title?: string; subject?: string | null; pinned?: boolean; archivedAt?: Date | null };

// Whitelist parser: only title/subject/pinned may change via PATCH —
// htmlContent and ownership fields are deliberately unreachable.
export function parseReviewerPatch(
  body: unknown
): { ok: true; patch: ReviewerPatch } | { ok: false; reason: string } {
  if (typeof body !== "object" || body === null) return { ok: false, reason: "Invalid request body." };
  const b = body as Record<string, unknown>;
  const patch: ReviewerPatch = {};
  if ("title" in b) {
    if (typeof b.title !== "string") return { ok: false, reason: "Title must be text." };
    const t = b.title.trim();
    if (!t || t.length > 200) return { ok: false, reason: "Title must be 1–200 characters." };
    patch.title = t;
  }
  if ("subject" in b) {
    if (b.subject !== null && typeof b.subject !== "string") return { ok: false, reason: "Subject must be text." };
    const s = typeof b.subject === "string" ? b.subject.trim() : "";
    if (s.length > 40) return { ok: false, reason: "Subject must be 40 characters or fewer." };
    patch.subject = s || null;
  }
  if ("pinned" in b) {
    if (typeof b.pinned !== "boolean") return { ok: false, reason: "Pinned must be true or false." };
    patch.pinned = b.pinned;
  }
  if ("archived" in b) {
    if (typeof b.archived !== "boolean") return { ok: false, reason: "Archived must be true or false." };
    patch.archivedAt = b.archived ? new Date() : null;
  }
  if (Object.keys(patch).length === 0) return { ok: false, reason: "Nothing to update." };
  return { ok: true, patch };
}
