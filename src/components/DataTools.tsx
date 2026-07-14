"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { exportBackup } from "@/lib/export-backup";
import { importBackup } from "@/lib/import-backup";

export default function DataTools() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onExport() {
    if (exporting) return;
    setExporting(true); setMsg(null);
    try { await exportBackup(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Export failed. Try again."); }
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
    } catch (e) { setMsg(e instanceof Error ? e.message : "Import failed. Try again."); }
    finally { setImporting(false); }
  }

  return (
    <div className="datatools">
      <div className="datatools-row">
        <button type="button" className="set-btn" onClick={onExport} disabled={exporting || importing}>
          {exporting ? "Preparing backup…" : "Export backup (.json)"}
        </button>
        <button type="button" className="set-btn" onClick={() => fileInput.current?.click()} disabled={exporting || importing}>
          {importing ? "Importing…" : "Import backup"}
        </button>
        <input
          ref={fileInput} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }}
        />
      </div>
      {msg && <p className="set-note">{msg}</p>}
    </div>
  );
}
