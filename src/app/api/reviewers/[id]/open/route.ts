import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers, openEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";

// Records that the user actually opened this reviewer to study. Drives
// "Continue studying" and accrues open_events for a future stats screen.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const updated = await db
      .update(reviewers)
      .set({ lastOpenedAt: new Date() })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    // Only log an event for a reviewer this user actually owns.
    if (updated.length) await db.insert(openEvents).values({ userId: user.id, reviewerId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
