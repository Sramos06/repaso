"use client";
import { useEffect, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/render-md";

type Revision = { id: string; createdAt: string; contentMd: string };

export default function NotesPanel({ reviewerId, open, onClose }: { reviewerId: string | null; open: boolean; onClose?: () => void }) {
  const key = `repaso-draft-${reviewerId ?? "scratchpad"}`;
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "saved" | "saving" | "offline">("loading");
  const [view, setView] = useState<"write" | "preview" | "history">("write");
  const [revisions, setRevisions] = useState<Revision[] | null>(null);
  const [revError, setRevError] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Tracks whether the user has typed since mount, so the in-flight mount GET
  // knows to discard its result instead of clobbering newer keystrokes.
  const dirtyRef = useRef(false);
  // Monotonic counter — each save's completion checks it's still the latest
  // in-flight save before touching localStorage/state, so a stale save (from
  // the draft-resync or an earlier debounce) can't clobber a newer one.
  const saveSeq = useRef(0);

  // Shared by the debounced keystroke save and the mount-time draft resync —
  // only clears the localStorage draft once the server has actually confirmed it.
  async function save(v: string, seq: number) {
    if (seq !== saveSeq.current) return; // stale before it even fired — don't touch the server
    try {
      const res = await fetch("/api/notes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId, contentMd: v }),
      });
      if (seq !== saveSeq.current) return;
      if (res.ok) { localStorage.removeItem(key); setState("saved"); }
      else setState("offline");
    } catch {
      if (seq !== saveSeq.current) return;
      setState("offline");
    }
  }

  useEffect(() => {
    let cancelled = false;
    dirtyRef.current = false;
    saveSeq.current++;
    setText("");
    setState("loading");
    setView("write");

    async function load() {
      const draft = localStorage.getItem(key);
      let ok = false;
      let contentMd = "";
      try {
        const res = await fetch(`/api/notes?reviewerId=${reviewerId ?? "scratchpad"}`);
        ok = res.ok;
        // Only trust the body on 2xx — on 4xx/5xx it's shaped { error }, and
        // reading contentMd off that would silently seed state with undefined.
        if (ok) contentMd = (await res.json()).contentMd ?? "";
      } catch {
        ok = false;
      }

      // The user already typed (and may have already saved) while this GET
      // was in flight — never let a late-arriving response overwrite it.
      if (cancelled || dirtyRef.current) return;

      if (draft != null) {
        // A leftover draft is unsynced by definition — show it, but don't
        // call it "saved" until we've actually round-tripped it to the server.
        setText(draft);
        setState("saving");
        const seq = ++saveSeq.current;
        await save(draft, seq);
        return;
      }

      if (ok) { setText(contentMd); setState("saved"); }
      else { setText(""); setState("offline"); }
    }

    load();
    return () => { cancelled = true; clearTimeout(timer.current); };
  }, [reviewerId]);

  // When the connection returns, push any locally-kept draft to the server.
  useEffect(() => {
    function onOnline() {
      const draft = localStorage.getItem(key);
      if (draft == null) return;
      const seq = ++saveSeq.current;
      setState("saving");
      save(draft, seq);
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerId]);

  function onChange(v: string) {
    dirtyRef.current = true;
    const seq = ++saveSeq.current; // keystroke immediately invalidates any in-flight save
    setText(v); setState("saving");
    localStorage.setItem(key, v); // draft survives session expiry / network loss
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { save(v, seq); }, 500);
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
    setRestoring(true);
    try {
      const res = await fetch("/api/notes/revisions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerId, revisionId: rev.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Adopt the restored text as the new saved state; anything in flight is stale now.
      saveSeq.current++;
      dirtyRef.current = false;
      localStorage.removeItem(key);
      setText(data.contentMd ?? rev.contentMd);
      setState("saved");
      setView("write");
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
      <span className="save">{{ loading: "…", saved: "SAVED ✓", saving: "SAVING…", offline: "KEPT LOCALLY · will sync" }[state]}</span>
    </aside>
  );
}
