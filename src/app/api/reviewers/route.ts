import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { validateUpload, MAX_BYTES, MAX_WIRE_BYTES, WIRE_LIMIT_REASON } from "@/lib/validate-upload";
import { parseUploadBody } from "@/lib/upload-body";
import { decodeContent, utf8Bytes } from "@/lib/content-codec";
import { stripHtml } from "@/lib/strip-html";

// GET — unchanged from before this version.
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

// POST — one file per request as JSON {name, encoding, payload}. The client
// compresses before sending (that is what lifts Vercel's request cap); the
// server decodes ONCE to validate and index, then stores the payload as-is.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = parseUploadBody(await req.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.reason }, { status: 400 });
    const { name, encoding, payload } = parsed;

    const reject = (reason: string) =>
      NextResponse.json({ created: [], rejected: [{ name, reason }] }, { status: 400 });

    if (utf8Bytes(payload) > MAX_WIRE_BYTES) {
      return reject(encoding === "gzip" ? WIRE_LIMIT_REASON : "File is over the 4 MB limit for uncompressed uploads.");
    }
    let raw: string;
    try {
      raw = await decodeContent(payload, encoding);
    } catch {
      return reject("Could not read this file. Try uploading it again.");
    }
    const rawBytes = utf8Bytes(raw);
    if (rawBytes > MAX_BYTES) return reject("File is over the 15 MB limit.");
    const check = validateUpload(name, rawBytes, raw);
    if (!check.ok) return reject(check.reason);

    const [row] = await db
      .insert(reviewers)
      .values({ userId: user.id, title: check.title, htmlContent: payload, encoding, sizeBytes: rawBytes, contentText: stripHtml(raw) })
      .returning({ id: reviewers.id, title: reviewers.title });
    return NextResponse.json({ created: [row], rejected: [] }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
