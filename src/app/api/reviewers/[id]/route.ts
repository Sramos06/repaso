import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";

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
    await db
      .update(reviewers)
      .set({ lastOpenedAt: new Date() })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)));
    return NextResponse.json(row);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
