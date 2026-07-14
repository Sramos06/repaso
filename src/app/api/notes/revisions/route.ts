import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes, noteRevisions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { resolveNoteTarget, isUuid } from "@/lib/note-target";
import { whereForNote } from "@/lib/note-where";
import { snapshotNote } from "@/lib/note-snapshot";
import { MAX_REVISIONS } from "@/lib/note-revisions";

// List a note's kept versions, newest first.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const target = resolveNoteTarget(req.nextUrl.searchParams.get("reviewerId"));
    if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });
    const note = await db.query.notes.findFirst({ where: whereForNote(user.id, target.reviewerId) });
    if (!note) return NextResponse.json({ revisions: [] });
    const rows = await db
      .select({ id: noteRevisions.id, createdAt: noteRevisions.createdAt, contentMd: noteRevisions.contentMd })
      .from(noteRevisions)
      .where(and(eq(noteRevisions.noteId, note.id), eq(noteRevisions.userId, user.id)))
      .orderBy(desc(noteRevisions.createdAt))
      .limit(MAX_REVISIONS);
    return NextResponse.json({ revisions: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Restore a version. ALWAYS snapshots the current text first (force = even
// restores are undoable), then writes the revision's content back.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const target = resolveNoteTarget(body?.reviewerId ?? null);
    if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });
    if (typeof body?.revisionId !== "string" || !isUuid(body.revisionId))
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    const note = await db.query.notes.findFirst({ where: whereForNote(user.id, target.reviewerId) });
    if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const rev = await db.query.noteRevisions.findFirst({
      where: and(eq(noteRevisions.id, body.revisionId), eq(noteRevisions.noteId, note.id), eq(noteRevisions.userId, user.id)),
    });
    if (!rev) return NextResponse.json({ error: "Not found." }, { status: 404 });

    await snapshotNote(note.id, user.id, note.contentMd, rev.contentMd, true);
    await db.update(notes).set({ contentMd: rev.contentMd, updatedAt: new Date() }).where(eq(notes.id, note.id));
    return NextResponse.json({ ok: true, contentMd: rev.contentMd });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
