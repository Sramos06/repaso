import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { coerceTheme, DEFAULT_THEME, type Theme } from "@/lib/themes";

// Safe theme read for the root layout, which also wraps signed-out pages.
// Returns the default rather than redirecting/throwing, and never upserts.
export async function getUserTheme(): Promise<Theme> {
  try {
    const session = await auth();
    const googleSub = (session as any)?.googleSub as string | undefined;
    if (!googleSub) return DEFAULT_THEME;
    const u = await db.query.users.findFirst({ where: eq(users.googleSub, googleSub) });
    return coerceTheme(u?.theme);
  } catch {
    return DEFAULT_THEME;
  }
}
