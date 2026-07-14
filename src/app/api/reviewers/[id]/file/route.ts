import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isUuid } from "@/lib/note-target";
import { validateUpload, MAX_BYTES } from "@/lib/validate-upload";
import { stripHtml } from "@/lib/strip-html";

// Swap a reviewer's HTML for an updated file. Title (renames win), subject,
// pin, archive state, notes, and the share link all survive; lastOpenedAt is
// untouched (replacing a file isn't studying it).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File is over the 4 MB limit." }, { status: 400 });
    const content = await file.text();
    const check = validateUpload(file.name, file.size, content); // same rules as upload; the new file's <title> is ignored
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
    const updated = await db
      .update(reviewers)
      .set({ htmlContent: content, contentText: stripHtml(content), sizeBytes: file.size, updatedAt: new Date() })
      .where(and(eq(reviewers.id, id), eq(reviewers.userId, user.id)))
      .returning({ id: reviewers.id });
    if (!updated.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
