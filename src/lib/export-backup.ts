// Browser-only: assembles a full backup by pulling each reviewer through the
// per-file endpoint (Vercel caps response bodies, so no single big response).
type ExportMeta = {
  exportedAt: string;
  reviewers: { id: string; title: string; subject: string | null; createdAt: string }[];
  notes: { reviewerId: string | null; contentMd: string; updatedAt: string }[];
};

export async function exportBackup(): Promise<void> {
  const metaRes = await fetch("/api/export");
  if (!metaRes.ok) throw new Error("Export failed — try again.");
  const meta: ExportMeta = await metaRes.json();

  const noteByReviewer = new Map(
    meta.notes.filter((n) => n.reviewerId !== null).map((n) => [n.reviewerId as string, n.contentMd])
  );
  const scratchpad = meta.notes.find((n) => n.reviewerId === null)?.contentMd ?? "";

  const files: { title: string; subject: string | null; createdAt: string; htmlContent: string; noteMd: string }[] = [];
  for (const r of meta.reviewers) {
    const res = await fetch(`/api/reviewers/${r.id}`);
    if (!res.ok) throw new Error(`Export failed on "${r.title}" — try again.`);
    const full = await res.json();
    files.push({ title: r.title, subject: r.subject, createdAt: r.createdAt, htmlContent: full.htmlContent, noteMd: noteByReviewer.get(r.id) ?? "" });
  }

  const payload = { app: "repaso", version: 1, exportedAt: meta.exportedAt, scratchpad, reviewers: files };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `repaso-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
