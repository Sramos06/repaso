import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { escapeLike } from "@/lib/search-pattern";
import { makeSnippet } from "@/lib/snippet";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
    if (q.length < 3) return NextResponse.json({ results: [] });
    const rows = await db
      .select({ id: reviewers.id, contentText: reviewers.contentText })
      .from(reviewers)
      .where(and(eq(reviewers.userId, user.id), ilike(reviewers.contentText, `%${escapeLike(q)}%`)));
    const results = rows.map((r) => ({ id: r.id, snippet: makeSnippet(r.contentText ?? "", q) }));
    return NextResponse.json({ results });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
