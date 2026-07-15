"use client";

import { formatBytes } from "@/lib/format-bytes";

export type StagedFile = {
  key: string;
  file: File;
  content: string; // read once at stage time; powers preview + local validation
  name: string;
  size: number;
  title: string | null; // set when the file passed local validation
  reason: string | null; // local validation failure: this file won't be added
  serverError?: string; // last attempt's server rejection: still retryable
};

export default function StagingTray({ items, busy, onRemove, onPreview, onConfirm }: {
  items: StagedFile[];
  busy: boolean;
  onRemove: (key: string) => void;
  onPreview: (key: string) => void;
  onConfirm: () => void;
}) {
  const valid = items.filter((s) => s.reason === null);
  const total = valid.reduce((sum, s) => sum + s.size, 0);

  return (
    <div className="tray">
      <h4>Ready to add · {valid.length} of {items.length}</h4>
      {items.map((s) => (
        <div key={s.key} className={`stagerow${s.reason ? " bad" : ""}`}>
          <div className="ficon">📄</div>
          <div className="fmeta">
            <div className="fname">{s.name}</div>
            <div className="fsize">
              {formatBytes(s.size)}
              {s.title && <> · title: “{s.title}”</>}
              {s.reason && <b className="warn"> · {s.reason}</b>}
              {!s.reason && s.serverError && <b className="warn"> · {s.serverError}</b>}
            </div>
          </div>
          {s.reason === null ? (
            <button type="button" className="peek" onClick={() => onPreview(s.key)} disabled={busy}>👁 Preview</button>
          ) : (
            <span className="badtag">won&rsquo;t be added</span>
          )}
          <button type="button" className="rm" onClick={() => onRemove(s.key)} disabled={busy} aria-label={`Remove ${s.name}`}>✕</button>
        </div>
      ))}
      <div className="tray-confirm">
        <span className="tot">Adding <b>{valid.length} file{valid.length === 1 ? "" : "s"} · {formatBytes(total)}</b> to your desk</span>
        <button type="button" className="tray-add" onClick={onConfirm} disabled={busy || valid.length === 0}>
          {busy ? "Adding…" : `Add ${valid.length} to desk`}
        </button>
      </div>
    </div>
  );
}
