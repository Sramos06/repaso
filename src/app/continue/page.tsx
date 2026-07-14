import { redirect } from "next/navigation";
import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";

// PWA shortcut target: jump straight to the most recently opened reviewer.
export default async function ContinueStudying() {
  const user = await requireUserOrRedirect();
  const [row] = await db
    .select({ id: reviewers.id })
    .from(reviewers)
    .where(and(eq(reviewers.userId, user.id), isNotNull(reviewers.lastOpenedAt)))
    .orderBy(desc(reviewers.lastOpenedAt))
    .limit(1);
  redirect(row ? `/viewer/${row.id}` : "/");
}
