"use client";
import { useEffect, useRef, useState } from "react";

export default function NotesPanel({ reviewerId, open }: { reviewerId: string | null; open: boolean }) {
  const key = `repaso-draft-${reviewerId ?? "scratchpad"}`;
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "saved" | "saving" | "offline">("loading");
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

  function onChange(v: string) {
    dirtyRef.current = true;
    const seq = ++saveSeq.current; // keystroke immediately invalidates any in-flight save
    setText(v); setState("saving");
    localStorage.setItem(key, v); // draft survives session expiry / network loss
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { save(v, seq); }, 500);
  }

  return (
    <aside className={`notes${open ? " on" : ""}`}>
      <header>
        <h5>margin notes</h5>
        <span className="save">{{ loading: "…", saved: "SAVED ✓", saving: "SAVING…", offline: "KEPT LOCALLY — will sync" }[state]}</span>
      </header>
      <textarea value={text} onChange={(e) => onChange(e.target.value)} disabled={state === "loading"} placeholder="Write anything — it autosaves…" />
    </aside>
  );
}
