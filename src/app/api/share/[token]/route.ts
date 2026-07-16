import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isShareToken } from "@/lib/share-token";

// PUBLIC — deliberately no requireUser. A valid, unrevoked token is the only
// credential. Returns just title + html; never the owner, id, or other rows.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (!isShareToken(token)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const row = await db.query.reviewers.findFirst({
      where: eq(reviewers.shareToken, token),
      columns: { title: true, htmlContent: true, encoding: true },
    });
    if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ title: row.title, htmlContent: row.htmlContent, encoding: row.encoding });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
