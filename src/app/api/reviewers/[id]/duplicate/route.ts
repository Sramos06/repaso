import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";
import { copyTitle } from "@/lib/copy-title";

// Clone a reviewer's file onto a fresh card. Deliberately NOT copied:
// pin, archive state, share link, open history, and notes.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const src = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, id), eq(reviewers.userId, user.id)),
      columns: { title: true, htmlContent: true, contentText: true, sizeBytes: true, subject: true },
    });
    if (!src) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const [row] = await db
      .insert(reviewers)
      .values({
        userId: user.id,
        title: copyTitle(src.title),
        htmlContent: src.htmlContent,
        contentText: src.contentText,
        sizeBytes: src.sizeBytes,
        subject: src.subject,
      })
      .returning({ id: reviewers.id });
    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
