import { NextResponse } from "next/server";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";

// Everything the local store needs to hydrate notes in one request.
export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({ reviewerId: notes.reviewerId, contentMd: notes.contentMd, updatedAt: notes.updatedAt })
      .from(notes)
      .where(eq(notes.userId, user.id));
    return NextResponse.json({
      notes: rows.map((n) => ({ reviewerId: n.reviewerId, contentMd: n.contentMd, updatedAt: n.updatedAt.toISOString() })),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
