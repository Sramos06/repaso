"use client";

import { useEffect, useState } from "react";
import type { LocalReviewer } from "@/lib/local-types";
import { getDeskRows } from "@/lib/local-reviewers";
import { clearLocalAndRehydrate, outboxCount } from "@/lib/sync";
import { onLocalChange } from "@/lib/local-db";
import { formatBytes } from "@/lib/format-bytes";

const SHOWN = 8;

export default function StorageSection() {
  const [rows, setRows] = useState<LocalReviewer[] | null>(null);
  const [waiting, setWaiting] = useState(0);
  const [quota, setQuota] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function readLocal() {
      const [r, w] = await Promise.all([getDeskRows(), outboxCount()]);
      if (!cancelled) { setRows(r); setWaiting(w); }
      try {
        const est = await navigator.storage?.estimate?.();
        if (!cancelled) setQuota(est?.quota ?? null);
      } catch { if (!cancelled) setQuota(null); }
    }
    void readLocal();
    const off = onLocalChange(() => { void readLocal(); });
    return () => { cancelled = true; off(); };
  }, []);

  const items = rows ?? [];
  const total = items.reduce((s, r) => s + r.sizeBytes, 0);
  const pct = quota && quota > 0 ? Math.max(2, Math.min(100, (total / quota) * 100)) : 2;

  async function onRedownload() {
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const result = await clearLocalAndRehydrate();
      setMsg(result.ok ? "Fresh copies downloaded. Cloud copies were never touched." : result.reason ?? "Try again.");
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
      {waiting > 0 && <p className="stor-cap">☁ {waiting} change{waiting === 1 ? "" : "s"} waiting to back up. They send automatically when you're online.</p>}
      {rows === null ? (
        <p className="stor-empty">Checking this device…</p>
      ) : items.length === 0 ? (
        <p className="stor-empty">Nothing saved yet. Open the desk while online and your reviewers download themselves.</p>
      ) : (
        <>
          {items.slice(0, SHOWN).map((r) => (
            <div className="stor-row" key={r.id}>
              <span className="nm">{r.title} {r.pending ? <span className="off">☁ backing up</span> : <span className="off">● on device</span>}</span>
              <span className="sz">{formatBytes(r.sizeBytes)}</span>
            </div>
          ))}
          {items.length > SHOWN && <div className="stor-row"><span className="nm more">+ {items.length - SHOWN} more…</span><span /></div>}
        </>
      )}
      <div className="stor-actions">
        <button type="button" className="set-btn" onClick={onRedownload} disabled={busy}>⟳ Re-download from the cloud</button>
      </div>
      {msg && <p className="set-note">{msg}</p>}
    </div>
  );
}
