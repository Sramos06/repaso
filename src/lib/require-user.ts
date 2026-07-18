import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// session -> db user (upsert on first login). Throws a 401 Response if
// unauthenticated or off the allow-list; callers (API routes) catch it.
export async function requireUser(): Promise<{ id: string; email: string }> {
  const session = await auth();
  // Narrow cast (not `any`): the session is augmented with googleSub in auth callbacks.
  const googleSub = (session as { googleSub?: string } | null)?.googleSub;
  const email = session?.user?.email?.toLowerCase();
  const allowed = process.env.ALLOWED_EMAIL?.toLowerCase();
  if (!session || !googleSub || !email || !allowed || email !== allowed) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const existing = await db.query.users.findFirst({ where: eq(users.googleSub, googleSub) });
  if (existing) return { id: existing.id, email: existing.email };
  // Two parallel first requests can both miss the SELECT above; the loser of
  // the INSERT race re-reads instead of throwing on the unique violation.
  const [created] = await db
    .insert(users)
    .values({ googleSub, email, name: session.user?.name ?? null })
    .onConflictDoNothing({ target: users.googleSub })
    .returning();
  if (created) return { id: created.id, email: created.email };
  const raced = await db.query.users.findFirst({ where: eq(users.googleSub, googleSub) });
  if (!raced) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  return { id: raced.id, email: raced.email };
}

// Page-facing variant: redirects to /signin instead of throwing.
export async function requireUserOrRedirect() {
  try {
    return await requireUser();
  } catch {
    redirect("/signin");
  }
}
