import Link from "next/link";
import type { DeskReviewer } from "./DeskClient";

export default function ReviewerCard({ r }: { r: DeskReviewer }) {
  return (
    <Link href={`/viewer/${r.id}`} className="card">
      {r.pinned && <span className="pinflag" title="Pinned">📌</span>}
      {r.subject && <span className="subject">{r.subject}</span>}
      <h4>{r.title}</h4>
      <div className="meta">
        <span>{r.date}</span>
        {r.hasNotes && (
          <span className="noteflag">
            <svg fill="none" strokeWidth="2.4" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 20h9" stroke="currentColor" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" /></svg>
            has notes
          </span>
        )}
      </div>
    </Link>
  );
}
