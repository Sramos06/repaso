"use client";
import { useEffect, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/render-md";
import { getLocalNote, saveNoteLocal, adoptServerNote } from "@/lib/local-reviewers";
import { onLocalChange } from "@/lib/local-db";

type Revision = { id: string; createdAt: string; contentMd: string };

export default function NotesPanel({ reviewerId, open, onClose }: { reviewerId: string | null; open: boolean; onClose?: () => void }) {
  const target = reviewerId ?? "scratchpad";
  const draftKey = `repaso-draft-${target}`; // legacy adoption only
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "saved" | "saving" | "pending" | "offline">("loading");
  const [view, setView] = useState<"write" | "preview" | "history">("write");
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [revError, setRevError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [merged, setMerged] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Latest typed text, so a note switch mid-debounce can flush instead of discard.
  const textRef = useRef("");
  // True from the first keystroke until the debounce fires — guards external
  // refreshes (other tab, merge) from clobbering text the user is mid-typing.
  const editingRef = useRef(false);

  async function readFromStore(preserveEditing: boolean) {
    if (preserveEditing && editingRef.current) return; // never clobber mid-typing
    const n = await getLocalNote(target);
    if (n) { setText(n.contentMd); setState(n.dirty ? "pending" : "saved"); return true; }
    return false;
  }

  useEffect(() => {
    let cancelled = false;
    editingRef.current = false;
    setText(""); setState("loading"); setView("write"); setMerged(false);

    async function load() {
      // one-time adoption of the retired localStorage draft system
      const legacy = localStorage.getItem(draftKey);
      if (legacy != null) {
        await saveNoteLocal(target, legacy);
        localStorage.removeItem(draftKey);
      }
      if (await readFromStore(false)) return;
      if (cancelled) return;
      // nothing local yet: live fetch (new device, store still hydrating)
      try {
        const res = await fetch(`/api/notes?reviewerId=${target}`);
        if (res.ok) {
          const d = await res.json();
          await adoptServerNote(target, d.contentMd ?? "", d.updatedAt ?? null);
          if (!cancelled && !editingRef.current) { setText(d.contentMd ?? ""); setState("saved"); }
          return;
        }
      } catch { /* offline with no local copy */ }
      // Nothing local and the live fetch failed: an honest badge, not "SAVED".
      if (!cancelled && !editingRef.current) { setText(""); setState("offline"); }
    }
    void load();

    const off = onLocalChange((msg) => {
      if (msg.type === "note-merged" && msg.target === target) { setMerged(true); setTimeout(() => setMerged(false), 6000); }
      void readFromStore(true);
    });
    return () => {
      cancelled = true; off();
      clearTimeout(timer.current);
      // Switching notes mid-debounce persists the keystrokes to the OLD target
      // (this closure's target) instead of discarding up to 500ms of typing.
      if (editingRef.current) { editingRef.current = false; void saveNoteLocal(target, textRef.current); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerId]);

  function onChange(v: string) {
    editingRef.current = true;
    textRef.current = v;
    setText(v); setState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      await saveNoteLocal(target, v);
      editingRef.current = false;
      setState("pending"); // outbox confirmation flips it to saved via onLocalChange
    }, 500);
  }

  async function openHistory() {
    setView("history"); setRevisions(null); setRevError(false); setExpanded(null);
    try {
      const res = await fetch(`/api/notes/revisions?reviewerId=${reviewerId ?? "scratchpad"}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRevisions(data.revisions ?? []);
    } catch { setRevError(true); }
  }

  async function restore(rev: Revision) {
    if (restoring) return;
    clearTimeout(timer.current); // kill any pending pre-restore autosave
    editingRef.current = false; // that autosave is dead; nothing left to guard
    setRestoring(true);
    try {
      const res = await fetch("/api/notes/revisions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId, revisionId: rev.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const restored = data.contentMd ?? rev.contentMd;
      setText(restored);
      setState("saved");
      setView("write");
      // Adopt into the local store too, so every tab (and the outbox) sees the
      // restored text. The restore PUT above is the unguarded legacy path.
      await saveNoteLocal(target, restored);
    } catch { setRevError(true); }
    finally { setRestoring(false); }
  }

  const when = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <aside className={`notes${open ? " on" : ""}`}>
      <header>
        <h5>margin notes</h5>
        <div className="seg">
          <button type="button" className={view === "write" ? "on" : ""} onClick={() => setView("write")}>Write</button>
          <button type="button" className={view === "preview" ? "on" : ""} onClick={() => setView("preview")}>Preview</button>
        </div>
        <button
          type="button"
          className={`nclose${view === "history" ? " on-hist" : ""}`}
          title="Version history"
          aria-label="Version history"
          onClick={() => (view === "history" ? setView("write") : openHistory())}
        >🕐</button>
        <a className="nclose" title="Print notes" aria-label="Print notes" href={`/print/notes/${reviewerId ?? "scratchpad"}`} target="_blank" rel="noopener">🖨</a>
        {onClose && <button type="button" className="nclose" onClick={onClose} aria-label="Close notes">✕</button>}
      </header>
      {view === "history" ? (
        <div className="nhistory">
          {revError ? (
            <p className="nh-empty">Couldn&rsquo;t load history. Try again.</p>
          ) : revisions === null ? (
            <p className="nh-empty">Loading…</p>
          ) : revisions.length === 0 ? (
            <p className="nh-empty">No older versions yet. Snapshots are kept as you save.</p>
          ) : (
            revisions.map((rev) => (
              <div key={rev.id} className="nh-item">
                <button type="button" className="nh-head" onClick={() => setExpanded(expanded === rev.id ? null : rev.id)}>
                  <span>{when(rev.createdAt)}</span>
                  <span className="nh-len">{rev.contentMd.length} chars</span>
                </button>
                {expanded === rev.id && (
                  <div className="nh-body">
                    {/* Safe: renderMarkdown escapes ALL input before adding its own tags. */}
                    <div className="notes-preview nh-prev" dangerouslySetInnerHTML={{ __html: renderMarkdown(rev.contentMd) }} />
                    <button type="button" className="nh-restore" disabled={restoring} onClick={() => restore(rev)}>
                      ↩ Restore this version
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : view === "write" ? (
        <textarea value={text} onChange={(e) => onChange(e.target.value)} disabled={state === "loading"} placeholder="Write anything. It autosaves…" />
      ) : (
        // Safe: renderMarkdown escapes ALL input before adding its own tags.
        <div className="notes-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
      )}
      {merged && <span className="save merged">Notes from two places were combined.</span>}
      <span className="save">{{ loading: "…", saved: "SAVED ✓", saving: "SAVING…", pending: "SAVED · BACKS UP ONLINE", offline: "OFFLINE · NOTHING LOADED YET" }[state]}</span>
    </aside>
  );
}
