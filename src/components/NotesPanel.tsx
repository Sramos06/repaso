"use client";
import { useEffect, useRef, useState } from "react";

export default function NotesPanel({ reviewerId, open }: { reviewerId: string | null; open: boolean }) {
  const key = `repaso-draft-${reviewerId ?? "scratchpad"}`;
  const [text, setText] = useState("");
  const [state, setState] = useState<"loading" | "saved" | "saving" | "offline">("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/notes?reviewerId=${reviewerId ?? "scratchpad"}`)
      .then((r) => r.json())
      .then((d) => { setText(localStorage.getItem(key) ?? d.contentMd); setState("saved"); })
      .catch(() => { setText(localStorage.getItem(key) ?? ""); setState("offline"); });
  }, [reviewerId, key]);

  function onChange(v: string) {
    setText(v); setState("saving");
    localStorage.setItem(key, v); // draft survives session expiry / network loss
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewerId, contentMd: v }),
        });
        if (res.ok) { localStorage.removeItem(key); setState("saved"); }
        else setState("offline");
      } catch { setState("offline"); }
    }, 500);
  }

  return (
    <aside className={`notes${open ? " on" : ""}`}>
      <header>
        <h5>margin notes</h5>
        <span className="save">{{ loading: "…", saved: "SAVED ✓", saving: "SAVING…", offline: "KEPT LOCALLY — will sync" }[state]}</span>
      </header>
      <textarea value={text} onChange={(e) => onChange(e.target.value)} placeholder="Write anything — it autosaves…" />
    </aside>
  );
}
