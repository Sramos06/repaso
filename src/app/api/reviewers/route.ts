import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { validateUpload, MAX_BYTES } from "@/lib/validate-upload";
import { stripHtml } from "@/lib/strip-html";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db
      .select({ id: reviewers.id, title: reviewers.title, createdAt: reviewers.createdAt })
      .from(reviewers)
      .where(eq(reviewers.userId, user.id))
      .orderBy(desc(reviewers.createdAt));
    return NextResponse.json({ reviewers: rows });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) return NextResponse.json({ error: "No files received." }, { status: 400 });

    const created: { id: string; title: string }[] = [];
    const rejected: { name: string; reason: string }[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        rejected.push({ name: file.name, reason: "File is over the 4 MB limit." });
        continue;
      }
      try {
        const content = await file.text();
        const check = validateUpload(file.name, file.size, content);
        if (!check.ok) { rejected.push({ name: file.name, reason: check.reason }); continue; }
        const [row] = await db
          .insert(reviewers)
          .values({ userId: user.id, title: check.title, htmlContent: content, sizeBytes: file.size, contentText: stripHtml(content) })
          .returning({ id: reviewers.id, title: reviewers.title });
        created.push(row);
      } catch {
        rejected.push({ name: file.name, reason: "Could not save this file. Try again." });
      }
    }
    return NextResponse.json({ created, rejected }, { status: created.length ? 201 : 400 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
