import Link from "next/link";
import type { DeskReviewer } from "./DeskClient";

type Props = {
  r: DeskReviewer;
  menuOpen: boolean;
  contentHit?: boolean;
  snippet?: string;
  term?: string;
  offline?: boolean;
  onMenuToggle: () => void;
  onPin: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onSend: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

// The whole card is a Link; action buttons preventDefault so taps never navigate.
function stop(e: React.MouseEvent, fn: () => void) {
  e.preventDefault();
  e.stopPropagation();
  fn();
}

// Highlight `term` inside a plain-text snippet WITHOUT dangerouslySetInnerHTML —
// split into React text nodes so any tag-shaped content is auto-escaped.
function highlight(text: string, term: string) {
  if (!term) return text;
  const lower = text.toLowerCase();
  const t = term.toLowerCase();
  const out: React.ReactNode[] = [];
  let i = 0;
  let n = 0;
  while (i < text.length) {
    const at = lower.indexOf(t, i);
    if (at === -1) { out.push(text.slice(i)); break; }
    if (at > i) out.push(text.slice(i, at));
    out.push(<mark key={n++}>{text.slice(at, at + term.length)}</mark>);
    i = at + term.length;
  }
  return out;
}

export default function ReviewerCard({ r, menuOpen, contentHit, snippet, term, offline, onMenuToggle, onPin, onRename, onDuplicate, onSend, onArchive, onDelete }: Props) {
  return (
    <Link href={`/viewer/${r.id}`} className={`card${r.archived ? " archived" : ""}`}>
      {!r.archived && (
        <button type="button" className={`pin${r.pinned ? " on" : ""}`} title={r.pinned ? "Unpin" : "Pin to top"} onClick={(e) => stop(e, onPin)}>📌</button>
      )}
      <button type="button" className="more" aria-label="Reviewer actions" onClick={(e) => stop(e, onMenuToggle)}>⋯</button>
      {menuOpen && (
        <div className="ctx" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <button type="button" onClick={(e) => stop(e, onRename)}>✏️ Rename</button>
          <button type="button" onClick={(e) => stop(e, onDuplicate)}>⧉ Duplicate</button>
          <button type="button" onClick={(e) => stop(e, onSend)}>📤 Send</button>
          <button type="button" onClick={(e) => stop(e, onArchive)}>{r.archived ? "📥 Unarchive" : "🗄 Archive"}</button>
          <div className="sep" />
          <button type="button" className="del" onClick={(e) => stop(e, onDelete)}>🗑 Delete</button>
        </div>
      )}
      {r.subject && <span className="subject">{r.subject}</span>}
      <h4>{r.title}</h4>
      {contentHit && snippet && <p className="snippet">{highlight(snippet, term ?? "")}</p>}
      <div className="meta">
        <span>{r.date}</span>
        <span className="flags">
          {contentHit && <span className="hitflag">found inside</span>}
          {offline && <span className="offflag" title="Available offline">● offline</span>}
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
