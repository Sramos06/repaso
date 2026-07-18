import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { openEvents, reviewers } from "@/db/schema";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";

// Raw open timestamps for a client-chosen range (the client owns timezone
// math; a UTC instant filter here is exact). Top 3 computed in SQL.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const from = Date.parse(req.nextUrl.searchParams.get("from") ?? "");
    const to = Date.parse(req.nextUrl.searchParams.get("to") ?? "");
    if (Number.isNaN(from) || Number.isNaN(to) || from > to || to - from > 400 * 86400000) {
      return NextResponse.json({ error: "Bad range." }, { status: 400 });
    }
    const range = and(
      eq(openEvents.userId, user.id),
      gte(openEvents.openedAt, new Date(from)),
      lte(openEvents.openedAt, new Date(to))
    );

    const rows = await db
      .select({ at: openEvents.openedAt })
      .from(openEvents)
      .where(range)
      .orderBy(asc(openEvents.openedAt))
      .limit(50000);

    const counts = await db
      .select({ reviewerId: openEvents.reviewerId, visits: sql<number>`count(*)::int` })
      .from(openEvents)
      .where(range)
      .groupBy(openEvents.reviewerId)
      .orderBy(sql`count(*) desc`)
      .limit(3);

    let top: { id: string; title: string; subject: string | null; visits: number }[] = [];
    if (counts.length) {
      const meta = await db
        .select({ id: reviewers.id, title: reviewers.title, subject: reviewers.subject })
        .from(reviewers)
        .where(and(eq(reviewers.userId, user.id), inArray(reviewers.id, counts.map((c) => c.reviewerId))));
      const byId = new Map(meta.map((m) => [m.id, m]));
      top = counts
        .filter((c) => byId.has(c.reviewerId))
        .map((c) => ({ ...byId.get(c.reviewerId)!, visits: c.visits }));
    }

    return NextResponse.json({ events: rows.map((r) => r.at.toISOString()), top });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
