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
      setErr("Couldn't save that. Check your connection and try again.");
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
            className={`tchip${sel === t.id ? " on" : ""}`}
            aria-pressed={sel === t.id}
            onClick={() => pick(t.id)}
            style={{ backgroundColor: t.preview.paper, color: t.preview.ink }}
          >
            <span className="tchip-tape" style={{ background: t.preview.washi }} />
            <span className="tchip-name">{t.label}</span>
            <span className="tchip-note">{t.note}</span>
            {sel === t.id && (
              <svg className="tchip-stamp" viewBox="0 0 120 60" aria-hidden style={{ color: t.preview.accent }}>
                <ellipse cx="60" cy="30" rx="54" ry="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" transform="rotate(-4 60 30)" />
                <ellipse cx="60" cy="30" rx="51" ry="21" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".5" transform="rotate(3 60 30)" />
              </svg>
            )}
          </button>
        ))}
      </div>
      {err && <p className="set-note err">{err}</p>}
    </>
  );
}
