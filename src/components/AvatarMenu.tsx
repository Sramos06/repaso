"use client";

import { useEffect, useRef, useState } from "react";
import { exportBackup } from "@/lib/export-backup";
import { signOutAction } from "@/app/actions";

export default function AvatarMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function onExport() {
    if (exporting) return;
    setExporting(true); setErr(null);
    try {
      await exportBackup();
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed — try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="avatar-wrap" ref={wrap}>
      <button type="button" className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        {email.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="menu">
          <div className="who"><b>Signed in</b><span>{email}</span></div>
          <button type="button" onClick={onExport} disabled={exporting}>
            {exporting ? "Preparing backup…" : "Export backup (.json)"}
          </button>
          {err && <p className="menu-err">{err}</p>}
          <form action={signOutAction}>
            <button type="submit" className="out">Log out</button>
          </form>
        </div>
      )}
    </div>
  );
}
