import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { escapeLike } from "@/lib/search-pattern";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 3) return NextResponse.json({ ids: [] });
    const rows = await db
      .select({ id: reviewers.id })
      .from(reviewers)
      .where(and(eq(reviewers.userId, user.id), ilike(reviewers.contentText, `%${escapeLike(q)}%`)));
    return NextResponse.json({ ids: rows.map((r) => r.id) });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
