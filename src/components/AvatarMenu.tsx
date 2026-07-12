"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { exportBackup } from "@/lib/export-backup";
import { importBackup } from "@/lib/import-backup";
import { signOutAction } from "@/app/actions";

export default function AvatarMenu({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  async function onExport() {
    if (exporting) return;
    setExporting(true); setMsg(null);
    try { await exportBackup(); setOpen(false); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Export failed — try again."); }
    finally { setExporting(false); }
  }

  async function onImportFile(file: File) {
    if (importing) return;
    setImporting(true); setMsg(null);
    try {
      const r = await importBackup(file);
      const bits = [`${r.added} added`];
      if (r.skipped.length) bits.push(`${r.skipped.length} already there`);
      if (r.failed.length) bits.push(`${r.failed.length} failed`);
      setMsg(bits.join(" · "));
      if (r.added) router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Import failed — try again."); }
    finally { setImporting(false); }
  }

  return (
    <div className="avatar-wrap" ref={wrap}>
      <button type="button" className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Account menu">
        {email.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="menu">
          <div className="who"><b>Signed in</b><span>{email}</span></div>
          <button type="button" onClick={onExport} disabled={exporting || importing}>
            {exporting ? "Preparing backup…" : "Export backup (.json)"}
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} disabled={exporting || importing}>
            {importing ? "Importing…" : "Import backup"}
          </button>
          <input
            ref={fileInput} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }}
          />
          {msg && <p className="menu-err">{msg}</p>}
          <form action={signOutAction}>
            <button type="submit" className="out">Log out</button>
          </form>
        </div>
      )}
    </div>
  );
}
