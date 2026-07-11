import { db } from "@/db";
import { reviewers, notes } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";
import ViewerFrame from "@/components/ViewerFrame";
import { notFound } from "next/navigation";

export default async function Viewer({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserOrRedirect();
  const { id } = await params;
  const isScratch = id === "scratchpad";
  let hasNotes = false;

  if (!isScratch) {
    if (!isUuid(id)) notFound();
    const row = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, id), eq(reviewers.userId, user.id)),
      columns: { id: true },
    });
    if (!row) notFound();
    const note = await db.query.notes.findFirst({
      where: and(eq(notes.userId, user.id), eq(notes.reviewerId, id), ne(notes.contentMd, "")),
      columns: { id: true },
    });
    hasNotes = !!note;
  }

  return <ViewerFrame reviewerId={isScratch ? null : id} hasNotes={hasNotes} />;
}
