import { db } from "@/db";
import { noteRevisions } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { shouldSnapshot, MAX_REVISIONS } from "@/lib/note-revisions";

// Record `prevContent` (the text being replaced) as a revision of this note,
// honoring the once-per-window policy — unless `force` (restores always keep
// what you're about to overwrite). Then prune to the newest MAX_REVISIONS.
export async function snapshotNote(noteId: string, userId: string, prevContent: string, nextContent: string, force = false): Promise<void> {
  if (force) {
    if (prevContent === "" || prevContent === nextContent) return; // still never snapshot emptiness/no-ops
  } else {
    const [latest] = await db
      .select({ createdAt: noteRevisions.createdAt })
      .from(noteRevisions)
      .where(eq(noteRevisions.noteId, noteId))
      .orderBy(desc(noteRevisions.createdAt))
      .limit(1);
    if (!shouldSnapshot(prevContent, nextContent, latest?.createdAt ?? null, new Date())) return;
  }
  await db.insert(noteRevisions).values({ noteId, userId, contentMd: prevContent });
  // prune anything beyond the newest MAX_REVISIONS
  const extras = await db
    .select({ id: noteRevisions.id })
    .from(noteRevisions)
    .where(eq(noteRevisions.noteId, noteId))
    .orderBy(desc(noteRevisions.createdAt))
    .offset(MAX_REVISIONS);
  if (extras.length) await db.delete(noteRevisions).where(inArray(noteRevisions.id, extras.map((x) => x.id)));
}
