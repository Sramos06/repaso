import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers, notes } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";

export async function GET() {
  try {
    const user = await requireUser();
    const reviewerRows = await db
      .select({ id: reviewers.id, title: reviewers.title, subject: reviewers.subject, createdAt: reviewers.createdAt })
      .from(reviewers)
      .where(eq(reviewers.userId, user.id))
      .orderBy(desc(reviewers.createdAt));
    const noteRows = await db
      .select({ reviewerId: notes.reviewerId, contentMd: notes.contentMd, updatedAt: notes.updatedAt })
      .from(notes)
      .where(eq(notes.userId, user.id));
    return NextResponse.json({ exportedAt: new Date().toISOString(), reviewers: reviewerRows, notes: noteRows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
