import { notFound } from "next/navigation";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import { resolveNoteTarget } from "@/lib/note-target";
import { whereForNote } from "@/lib/note-where";
import { renderMarkdown } from "@/lib/render-md";
import AutoPrint from "@/components/AutoPrint";

export default async function PrintNotes({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserOrRedirect();
  const { id } = await params;
  const target = resolveNoteTarget(id);
  if ("error" in target) notFound();

  let title = "Scratchpad";
  if (target.reviewerId) {
    const r = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, target.reviewerId), eq(reviewers.userId, user.id)),
      columns: { title: true },
    });
    if (!r) notFound();
    title = r.title;
  }
  const note = await db.query.notes.findFirst({ where: whereForNote(user.id, target.reviewerId) });
  const contentMd = note?.contentMd ?? "";

  return (
    <div className="printsheet">
      <header>
        <h1>{title}</h1>
        <p className="print-sub">
          margin notes · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>
      {contentMd ? (
        // Safe: renderMarkdown escapes ALL input before adding its own tags.
        <div className="notes-preview print-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(contentMd) }} />
      ) : (
        <p className="print-empty">No notes here yet.</p>
      )}
      <AutoPrint />
    </div>
  );
}
