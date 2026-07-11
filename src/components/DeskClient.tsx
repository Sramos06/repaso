"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import UploadZone from "./UploadZone";
import ReviewerCard from "./ReviewerCard";

export type DeskReviewer = {
  id: string; title: string; subject: string | null; pinned: boolean; date: string; hasNotes: boolean;
};

export default function DeskClient({ reviewers, email }: { reviewers: DeskReviewer[]; email: string }) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviewers;
    return reviewers.filter((r) => r.title.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q));
  }, [query, reviewers]);

  return (
    <div className="app">
      <header>
        <div className="brand"><h1>Repa<em>so</em></h1></div>
        <div className="search">
          <svg fill="none" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" /><path d="M21 21l-4.3-4.3" stroke="currentColor" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your reviewers…" aria-label="Search reviewers" />
        </div>
        <div className="avatar" title={email}>{email.charAt(0).toUpperCase()}</div>
      </header>

      <UploadZone />

      <div className="seclabel"><h3>On the desk</h3><div className="line" /><span className="count">{reviewers.length} FILES</span></div>
      <div className="cards">
        {shown.map((r) => <ReviewerCard key={r.id} r={r} />)}
        {shown.length === 0 && <p className="empty">{query ? "Nothing on the desk matches that…" : "Drop your first reviewer above ↑"}</p>}
      </div>

      <Link href="/viewer/scratchpad" className="fab">✎ Scratchpad</Link>
    </div>
  );
}
