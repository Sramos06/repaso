import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";
import { newShareToken } from "@/lib/share-token";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const existing = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, id), eq(reviewers.userId, user.id)),
      columns: { shareToken: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (existing.shareToken) return NextResponse.json({ token: existing.shareToken });
    const token = newShareToken();
    // Confirm the write landed (parity with DELETE/PATCH): if the reviewer was
    // deleted between the findFirst and here, don't hand back an unpersisted token.
    const minted = await db
      .update(reviewers)
      .set({ shareToken: token })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    if (!minted.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ token });
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
    const updated = await db
      .update(reviewers)
      .set({ shareToken: null })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    if (!updated.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
