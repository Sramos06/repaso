"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadZone() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send(files: FileList | File[]) {
    if (busy) return;
    setBusy(true); setMsg(null);
    // Vercel caps request bodies (~4.5 MB) — one file per request so a
    // batch drop of many files keeps working even though each is capped.
    const created: { id: string; title: string }[] = [];
    const rejected: { name: string; reason: string }[] = [];
    try {
      for (const file of [...files]) {
        const fd = new FormData();
        fd.append("files", file);
        try {
          const res = await fetch("/api/reviewers", { method: "POST", body: fd });
          if (res.status === 413) {
            rejected.push({ name: file.name, reason: "Too large to upload." });
            continue;
          }
          const data = await res.json();
          if (data.error) rejected.push({ name: file.name, reason: data.error });
          if (data.rejected?.length) rejected.push(...data.rejected);
          if (data.created?.length) created.push(...data.created);
        } catch {
          rejected.push({ name: file.name, reason: "Could not reach the server. Check your connection and try again." });
        }
      }
      if (rejected.length) setMsg(rejected.map((r) => `${r.name}: ${r.reason}`).join(" · "));
      if (created.length) router.refresh();
    } catch {
      setMsg("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="upload"
      onClick={() => !busy && input.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); if (!busy && e.dataTransfer.files.length) send(e.dataTransfer.files); }}
    >
      <div className="stampbox">↑</div>
      <div>
        <h2>{busy ? "Saving to your desk…" : "Drop a reviewer here"}</h2>
        <p>{msg ?? "or tap to pick (.html files, saved forever)"}</p>
      </div>
      <input ref={input} type="file" accept=".html,.htm" multiple hidden
        onChange={(e) => e.target.files && send(e.target.files)} />
    </div>
  );
}
