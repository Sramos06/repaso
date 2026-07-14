"use client";

import { useEffect, useState } from "react";
import { cachedReviewerIds, precacheReviewers, evictReviewers } from "@/lib/offline-cache";
import { formatBytes } from "@/lib/format-bytes";

type Item = { id: string; title: string; sizeBytes: number };

const SHOWN = 8;

export default function StorageSection({ reviewers }: { reviewers: Item[] }) {
  const [cached, setCached] = useState<Set<string> | null>(null);
  const [quota, setQuota] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refreshView() {
    const ids = reviewers.map((r) => r.id);
    const set = await cachedReviewerIds(ids);
    setCached(set);
    try {
      const est = await navigator.storage?.estimate?.();
      setQuota(est?.quota ?? null);
    } catch { setQuota(null); }
  }

  useEffect(() => {
    refreshView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cached ? reviewers.filter((r) => cached.has(r.id)) : [];
  const total = items.reduce((s, r) => s + r.sizeBytes, 0);
  const pct = quota && quota > 0 ? Math.max(2, Math.min(100, (total / quota) * 100)) : 2;

  async function onRefresh() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const ids = reviewers.map((r) => r.id);
      await evictReviewers(ids);
      precacheReviewers(ids);
    } catch { setBusy(false); return; }
    // give the service worker a moment to fetch before re-reading
    setTimeout(async () => {
      try { await refreshView(); setMsg("Offline copies refreshed"); }
      finally { setBusy(false); }
    }, 2500);
  }

  async function onClear() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      await evictReviewers(reviewers.map((r) => r.id));
      await refreshView();
      setMsg("Device copies cleared. Cloud copies are safe.");
    } finally { setBusy(false); }
  }

  return (
    <div className="storagebox">
      <div className="stor-total">
        <b>{formatBytes(total)}</b>
        <span>on this device · {items.length} reviewer{items.length === 1 ? "" : "s"}</span>
      </div>
      <div className="stor-bar"><i style={{ width: `${pct}%` }} /></div>
      <p className="stor-cap">
        {quota
          ? `Your browser allows about ${formatBytes(quota)} here. Reviewers will never come close.`
          : "Your browser allows far more space here than reviewers will ever need."}
      </p>
      {cached === null ? (
        <p className="stor-empty">Checking this device…</p>
      ) : items.length === 0 ? (
        <p className="stor-empty">Nothing saved yet. Open the desk while online and copies save automatically.</p>
      ) : (
        <>
          {items.slice(0, SHOWN).map((r) => (
            <div className="stor-row" key={r.id}>
              <span className="nm">{r.title} <span className="off">● offline</span></span>
              <span className="sz">{formatBytes(r.sizeBytes)}</span>
            </div>
          ))}
          {items.length > SHOWN && <div className="stor-row"><span className="nm more">+ {items.length - SHOWN} more…</span><span /></div>}
        </>
      )}
      <div className="stor-actions">
        <button type="button" className="set-btn" onClick={onRefresh} disabled={busy}>⟳ Refresh offline copies</button>
        <button type="button" className="set-btn danger" onClick={onClear} disabled={busy}>✕ Clear offline copies</button>
      </div>
      {msg && <p className="set-note">{msg}</p>}
    </div>
  );
}
