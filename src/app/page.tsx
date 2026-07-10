import { db } from "@/db";
import { reviewers } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireUserOrRedirect } from "@/lib/require-user";
import UploadZone from "@/components/UploadZone";
import ReviewerCard from "@/components/ReviewerCard";
import Link from "next/link";

export default async function Library() {
  const user = await requireUserOrRedirect();
  const rows = await db
    .select({ id: reviewers.id, title: reviewers.title, createdAt: reviewers.createdAt })
    .from(reviewers)
    .where(eq(reviewers.userId, user.id))
    .orderBy(desc(reviewers.createdAt));

  return (
    <div className="app">
      <header>
        <div className="brand"><h1>Repa<em>so</em></h1><span className="tag">your reviewers, kept safe ✦</span></div>
        <div className="avatar">S</div>
      </header>
      <p className="greet">Welcome back — <strong>{rows.length}</strong> reviewer{rows.length === 1 ? "" : "s"} on your desk.</p>
      <UploadZone />
      <div className="seclabel"><h3>On the desk</h3><div className="line" /><span className="count">{rows.length} FILES</span></div>
      <div className="cards">
        {rows.map((r) => <ReviewerCard key={r.id} id={r.id} title={r.title} date={r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} />)}
      </div>
      <Link href="/viewer/scratchpad" className="fab">✎ Scratchpad</Link>
    </div>
  );
}
