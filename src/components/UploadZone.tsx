"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateUpload } from "@/lib/validate-upload";
import { uploadOne } from "@/lib/upload-one";
import StagingTray, { type StagedFile } from "./StagingTray";
import PasteModal from "./PasteModal";

export default function UploadZone() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [preview, setPreview] = useState<StagedFile | null>(null);

  // Dropping/picking STAGES files (with the same validation the server runs)
  // instead of uploading; nothing saves until the tray's confirm.
  async function stage(files: FileList | File[]) {
    if (busy) return;
    setMsg(null);
    const next: StagedFile[] = [];
    for (const file of [...files]) {
      const content = await file.text();
      const check = validateUpload(file.name, file.size, content);
      next.push({
        key: crypto.randomUUID(),
        file,
        content,
        name: file.name,
        size: file.size,
        title: check.ok ? check.title : null,
        reason: check.ok ? null : check.reason,
      });
    }
    setStaged((prev) => [...prev, ...next]);
  }

  async function confirm() {
    if (busy) return;
    const valid = staged.filter((s) => s.reason === null);
    if (valid.length === 0) return;
    setBusy(true); setMsg(null);
    const failed = new Map<string, string>();
    let ok = 0;
    for (const item of valid) {
      const result = await uploadOne(item.file);
      if (result.ok) ok++;
      else failed.set(item.key, result.reason);
    }
    if (failed.size === 0) {
      setStaged([]); // full success: the tray clears itself
      setMsg(`Added ${ok} to your desk`);
    } else {
      // Honest results: drop the successes, keep failures (retryable) with the server's reason.
      setStaged((prev) =>
        prev
          .filter((s) => s.reason !== null || failed.has(s.key))
          .map((s) => (failed.has(s.key) ? { ...s, serverError: failed.get(s.key) } : s))
      );
      setMsg(ok ? `Added ${ok} of ${valid.length}. The rest stayed below.` : "Nothing was added. See the reasons below.");
    }
    if (ok) router.refresh();
    setBusy(false);
  }

  return (
    <>
      <div className="splitzone">
        <div
          className="dropside"
          onClick={() => !busy && input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (!busy && e.dataTransfer.files.length) stage(e.dataTransfer.files); }}
        >
          <div className="stampbox">↑</div>
          <div>
            <h2>{busy ? "Saving to your desk…" : "Drop reviewers here"}</h2>
            <p>{msg ?? "or tap to pick (.html files, saved forever)"}</p>
          </div>
          <input
            ref={input} type="file" accept=".html,.htm" multiple hidden
            onChange={(e) => { if (e.target.files) stage(e.target.files); e.target.value = ""; }}
          />
        </div>
        <button type="button" className="pasteside" onClick={() => setPasteOpen(true)}>
          <span className="pbig">✂</span><b>Paste HTML</b><span>no file needed</span>
        </button>
      </div>

      {staged.length > 0 && (
        <StagingTray
          items={staged}
          busy={busy}
          onRemove={(key) => setStaged((prev) => prev.filter((s) => s.key !== key))}
          onPreview={(key) => setPreview(staged.find((s) => s.key === key) ?? null)}
          onConfirm={confirm}
        />
      )}

      {preview && (
        <div className="overlay" onClick={() => setPreview(null)}>
          <div className="modal preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{preview.title ?? preview.name}</h3>
            <p className="modal-sub">A peek inside before it lands on your desk. Sandboxed, just like the viewer.</p>
            {/* allow-scripts only, NEVER allow-same-origin (staged HTML must not touch the app) */}
            <iframe className="stage-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview.content} title="Staged reviewer preview" />
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setPreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {pasteOpen && (
        <PasteModal
          onClose={() => setPasteOpen(false)}
          onSaved={(m) => { setMsg(m); router.refresh(); }}
        />
      )}
    </>
  );
}
