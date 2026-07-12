import Link from "next/link";
import type { DeskReviewer } from "./DeskClient";

type Props = {
  r: DeskReviewer;
  menuOpen: boolean;
  contentHit?: boolean;
  onMenuToggle: () => void;
  onPin: () => void;
  onRename: () => void;
  onArchive: () => void;
  onShare: () => void;
  onDelete: () => void;
};

// The whole card is a Link; action buttons preventDefault so taps never navigate.
function stop(e: React.MouseEvent, fn: () => void) {
  e.preventDefault();
  e.stopPropagation();
  fn();
}

export default function ReviewerCard({ r, menuOpen, contentHit, onMenuToggle, onPin, onRename, onArchive, onShare, onDelete }: Props) {
  return (
    <Link href={`/viewer/${r.id}`} className={`card${r.archived ? " archived" : ""}`}>
      {!r.archived && (
        <button type="button" className={`pin${r.pinned ? " on" : ""}`} title={r.pinned ? "Unpin" : "Pin to top"} onClick={(e) => stop(e, onPin)}>📌</button>
      )}
      <button type="button" className="more" aria-label="Reviewer actions" onClick={(e) => stop(e, onMenuToggle)}>⋯</button>
      {menuOpen && (
        <div className="ctx" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <button type="button" onClick={(e) => stop(e, onRename)}>✏️ Rename</button>
          {!r.archived && <button type="button" onClick={(e) => stop(e, onPin)}>📌 {r.pinned ? "Unpin" : "Pin"}</button>}
          <button type="button" onClick={(e) => stop(e, onShare)}>🔗 Share link</button>
          <button type="button" onClick={(e) => stop(e, onArchive)}>{r.archived ? "📤 Unarchive" : "🗄 Archive"}</button>
          <button type="button" className="del" onClick={(e) => stop(e, onDelete)}>🗑 Delete</button>
        </div>
      )}
      {r.subject && <span className="subject">{r.subject}</span>}
      <h4>{r.title}</h4>
      <div className="meta">
        <span>{r.date}</span>
        <span className="flags">
          {contentHit && <span className="hitflag">found inside</span>}
          {r.archived && <span className="archflag">archived</span>}
          {r.hasNotes && (
            <span className="noteflag">
              <svg fill="none" strokeWidth="2.4" viewBox="0 0 24 24" strokeLinecap="round"><path d="M12 20h9" stroke="currentColor" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" /></svg>
              has notes
            </span>
          )}
        </span>
      </div>
    </Link>
  );
}
