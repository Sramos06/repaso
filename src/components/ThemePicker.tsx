"use client";

import { useState } from "react";
import { THEMES, type Theme } from "@/lib/themes";

export default function ThemePicker({ current }: { current: Theme }) {
  const [sel, setSel] = useState<Theme>(current);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(id: Theme) {
    if (id === sel || busy) return;
    const prev = sel;
    setSel(id); setErr(null); setBusy(true);
    document.documentElement.setAttribute("data-theme", id); // instant, optimistic
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: id }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setSel(prev);
      document.documentElement.setAttribute("data-theme", prev); // revert
      setErr("Couldn't save that — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="themegrid">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`themecard${sel === t.id ? " sel" : ""}`}
            aria-pressed={sel === t.id}
            onClick={() => pick(t.id)}
          >
            <span className="tswatch" style={{ background: t.swatch }} />
            <span className="tmeta"><span className="tname">{t.label}</span><span className="tnote">{t.note}</span></span>
            {sel === t.id && <span className="tcheck" aria-hidden>✓</span>}
          </button>
        ))}
      </div>
      {err && <p className="set-note err">{err}</p>}
    </>
  );
}
