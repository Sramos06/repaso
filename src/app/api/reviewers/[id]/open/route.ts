import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";

// Records that the user actually opened this reviewer to study — the signal
// behind "Continue studying". Kept off GET so downloads/precache don't pollute it.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await db
      .update(reviewers)
      .set({ lastOpenedAt: new Date() })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
