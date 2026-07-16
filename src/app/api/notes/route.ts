import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/require-user";
import { resolveNoteTarget } from "@/lib/note-target";
import { whereForNote } from "@/lib/note-where";
import { snapshotNote } from "@/lib/note-snapshot";
import { noteConflict } from "@/lib/note-conflict";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const target = resolveNoteTarget(req.nextUrl.searchParams.get("reviewerId"));
    if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });
    const row = await db.query.notes.findFirst({ where: whereForNote(user.id, target.reviewerId) });
    return NextResponse.json({ contentMd: row?.contentMd ?? "", updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const target = resolveNoteTarget(body.reviewerId ?? null);
    if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });
    if (typeof body.contentMd !== "string" || body.contentMd.length > 100_000)
      return NextResponse.json({ error: "Invalid note content." }, { status: 400 });

    const existing = await db.query.notes.findFirst({ where: whereForNote(user.id, target.reviewerId) });
    if (existing && noteConflict(existing.updatedAt, existing.contentMd, body.baseUpdatedAt)) {
      return NextResponse.json(
        { contentMd: existing.contentMd, updatedAt: existing.updatedAt.toISOString() },
        { status: 409 }
      );
    }
    // History: keep what's being replaced (policy-gated), BEFORE overwriting it.
    if (existing) await snapshotNote(existing.id, user.id, existing.contentMd, body.contentMd);

    const stamp = new Date();
    await db
      .insert(notes)
      .values({ userId: user.id, reviewerId: target.reviewerId, contentMd: body.contentMd, updatedAt: stamp })
      .onConflictDoUpdate({
        target: [notes.userId, notes.reviewerId],
        set: { contentMd: body.contentMd, updatedAt: stamp },
      });
    return NextResponse.json({ ok: true, updatedAt: stamp.toISOString() });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
