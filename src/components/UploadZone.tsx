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
    const fd = new FormData();
    [...files].forEach((f) => fd.append("files", f));
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/reviewers", { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) setMsg(data.error);
      if (data.rejected?.length) setMsg(data.rejected.map((r: any) => `${r.name}: ${r.reason}`).join(" · "));
      if (data.created?.length) router.refresh();
    } catch (e) {
      setMsg("Could not reach the server — check your connection and try again.");
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
        <p>{msg ?? "or tap to pick — .html files, saved forever"}</p>
      </div>
      <input ref={input} type="file" accept=".html,.htm" multiple hidden
        onChange={(e) => e.target.files && send(e.target.files)} />
    </div>
  );
}
