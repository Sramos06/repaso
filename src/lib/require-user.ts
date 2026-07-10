import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// session -> db user (upsert on first login). Throws a 401 Response if
// unauthenticated or off the allow-list; callers (API routes) catch it.
export async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const googleSub = (session as any)?.googleSub as string | undefined;
  const email = session?.user?.email;
  if (!session || !googleSub || !email || email !== process.env.ALLOWED_EMAIL) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const existing = await db.query.users.findFirst({ where: eq(users.googleSub, googleSub) });
  if (existing) return { id: existing.id, email: existing.email };
  const [created] = await db
    .insert(users)
    .values({ googleSub, email, name: session.user?.name ?? null })
    .returning();
  return { id: created.id, email: created.email };
}

// Page-facing variant: redirects to /signin instead of throwing.
export async function requireUserOrRedirect() {
  try {
    return await requireUser();
  } catch {
    redirect("/signin");
  }
}
