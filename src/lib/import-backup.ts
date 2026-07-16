import { uploadOne } from "./upload-one";

export type BackupReviewer = {
  title: string; subject: string | null; pinned: boolean; archived: boolean; htmlContent: string; noteMd: string;
};
export type Backup = { scratchpad: string; reviewers: BackupReviewer[] };
export type ImportResult = { added: number; skipped: string[]; failed: string[] };

// Pure, testable: validates a parsed backup object and normalizes v1 → v2 shape.
export function parseBackup(json: unknown): { ok: true; data: Backup } | { ok: false; reason: string } {
  if (typeof json !== "object" || json === null) return { ok: false, reason: "That isn’t a Repaso backup file." };
  const b = json as Record<string, unknown>;
  if (b.app !== "repaso") return { ok: false, reason: "That isn’t a Repaso backup file." };
  if (b.version !== 1 && b.version !== 2) return { ok: false, reason: "This backup was made by a newer version of Repaso." };
  if (!Array.isArray(b.reviewers)) return { ok: false, reason: "This backup is missing its reviewers." };
  const reviewers: BackupReviewer[] = [];
  for (const raw of b.reviewers) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.title !== "string" || typeof r.htmlContent !== "string") continue;
    reviewers.push({
      title: r.title,
      subject: typeof r.subject === "string" ? r.subject : null,
      pinned: r.pinned === true,
      archived: r.archived === true,
      htmlContent: r.htmlContent,
      noteMd: typeof r.noteMd === "string" ? r.noteMd : "",
    });
  }
  return { ok: true, data: { scratchpad: typeof b.scratchpad === "string" ? b.scratchpad : "", reviewers } };
}

// Browser-only: reuses the normal upload/patch/notes endpoints, so server-side
// validation and the 15 MB cap apply for free. Title-duplicates are skipped;
// createdAt is not preserved (server stamps upload time).
export async function importBackup(file: File): Promise<ImportResult> {
  let json: unknown;
  try { json = JSON.parse(await file.text()); }
  catch { throw new Error("That file isn’t valid JSON."); }
  const parsed = parseBackup(json);
  if (!parsed.ok) throw new Error(parsed.reason);

  const listRes = await fetch("/api/reviewers");
  if (!listRes.ok) throw new Error("Couldn’t read your current desk. Try again.");
  const existing: { title: string }[] = (await listRes.json()).reviewers ?? [];
  const have = new Set(existing.map((r) => r.title.toLowerCase()));

  const result: ImportResult = { added: 0, skipped: [], failed: [] };
  for (const r of parsed.data.reviewers) {
    if (have.has(r.title.toLowerCase())) { result.skipped.push(r.title); continue; }
    let created: { id: string } | undefined;
    const up = await uploadOne(`${r.title}.html`, r.htmlContent);
    created = up.ok ? { id: up.id } : undefined;
    if (!created?.id) { result.failed.push(r.title); continue; }
    // The reviewer row now exists — count it as added and register its title so a
    // later same-titled entry is skipped. The metadata below is best-effort: a
    // failure degrades pin/archive/subject/title but never un-creates the file.
    const id = created.id;
    have.add(r.title.toLowerCase());
    result.added++;
    try {
      await fetch(`/api/reviewers/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: r.title, subject: r.subject, pinned: r.pinned, archived: r.archived }),
      });
    } catch { /* best-effort metadata */ }
    if (r.noteMd) {
      try {
        await fetch("/api/notes", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewerId: id, contentMd: r.noteMd }),
        });
      } catch { /* best-effort note */ }
    }
  }

  // Scratchpad: only write when we could CONFIRM the current one is empty. A failed
  // read must not be treated as empty — that would clobber real notes.
  if (parsed.data.scratchpad) {
    try {
      const sres = await fetch("/api/notes?reviewerId=scratchpad");
      if (sres.ok && !((await sres.json()).contentMd ?? "")) {
        await fetch("/api/notes", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewerId: "scratchpad", contentMd: parsed.data.scratchpad }),
        });
      }
    } catch { /* non-fatal: on any error, leave the existing scratchpad untouched */ }
  }
  return result;
}
