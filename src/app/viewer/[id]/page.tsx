import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import ViewerFrame from "@/components/ViewerFrame";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function Viewer({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUserOrRedirect();
  const { id } = await params;
  const isScratch = id === "scratchpad";
  let title = "Scratchpad";

  if (!isScratch) {
    const row = await db.query.reviewers.findFirst({
      where: and(eq(reviewers.id, id), eq(reviewers.userId, user.id)),
      columns: { title: true },
    });
    if (!row) notFound();
    title = row.title;
  }

  return (
    <div className="viewer on">
      <div className="vbar">
        <Link href="/" className="back">← Desk</Link>
        <span className="vtitle">{title}</span>
      </div>
      <ViewerFrame reviewerId={isScratch ? null : id} />
    </div>
  );
}
