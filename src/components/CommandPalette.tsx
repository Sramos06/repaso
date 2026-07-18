"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; title: string; subject: string | null };

export default function CommandPalette({ items, onClose }: { items: Item[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? items.filter((i) => i.title.toLowerCase().includes(s) || (i.subject ?? "").toLowerCase().includes(s)) : items;
    return list.slice(0, 8);
  }, [q, items]);

  // Re-pick the highlighted row whenever the query changes, computed during
  // render (not an effect) so the very first paint after a keystroke is right.
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) { setLastQ(q); setActive(0); }

  function go(i: Item | undefined) { if (i) { router.push(`/viewer/${i.id}`); onClose(); } }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(filtered[active]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  return (
    <div className="overlay palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Jump to a reviewer…" aria-label="Jump to a reviewer" />
        <ul>
          {filtered.map((i, idx) => (
            <li key={i.id} className={idx === active ? "on" : ""} onMouseEnter={() => setActive(idx)} onClick={() => go(i)}>
              <span className="pt">{i.title}</span>
              {i.subject && <span className="ps">{i.subject}</span>}
            </li>
          ))}
          {filtered.length === 0 && <li className="none">No match</li>}
        </ul>
      </div>
    </div>
  );
}
