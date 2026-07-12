import { db } from "@/db";
import { reviewers, notes } from "@/db/schema";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import DeskClient from "@/components/DeskClient";

export default async function Library() {
  const user = await requireUserOrRedirect();
  const rows = await db
    .select({ id: reviewers.id, title: reviewers.title, subject: reviewers.subject, pinned: reviewers.pinned, archivedAt: reviewers.archivedAt, createdAt: reviewers.createdAt })
    .from(reviewers)
    .where(eq(reviewers.userId, user.id))
    .orderBy(desc(reviewers.pinned), desc(reviewers.createdAt));
  const noteRows = await db
    .select({ rid: notes.reviewerId })
    .from(notes)
    .where(and(eq(notes.userId, user.id), isNotNull(notes.reviewerId), ne(notes.contentMd, "")));
  const withNotes = new Set(noteRows.map((n) => n.rid));

  return (
    <DeskClient
      email={user.email}
      reviewers={rows.map((r) => ({
        id: r.id,
        title: r.title,
        subject: r.subject,
        pinned: r.pinned,
        archived: r.archivedAt !== null,
        date: r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        hasNotes: withNotes.has(r.id),
      }))}
    />
  );
}
