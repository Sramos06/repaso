import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/require-user";
import { isTheme } from "@/lib/themes";

// Saves account-level settings. Today: the theme. Owner-scoped.
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!isTheme(body?.theme)) {
      return NextResponse.json({ error: "Unknown theme." }, { status: 400 });
    }
    await db.update(users).set({ theme: body.theme }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e; // requireUser 401
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
