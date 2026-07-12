import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db";
import { reviewers, notes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";
import { parseReviewerPatch } from "@/lib/reviewer-patch";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const row = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, id), eq(reviewers.userId, user.id)),
      columns: { id: true, title: true, htmlContent: true },
    });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const parsed = parseReviewerPatch(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
    const updated = await db
      .update(reviewers)
      .set({ ...parsed.patch, updatedAt: new Date() })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    if (!updated.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    // Delete the note explicitly rather than trusting the FK cascade state in prod.
    await db.delete(notes).where(and(eq(notes.userId, user.id), eq(notes.reviewerId, id)));
    const deleted = await db
      .delete(reviewers)
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    if (!deleted.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
