"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotesPanel from "./NotesPanel";
import { useWakeLock } from "@/lib/use-wake-lock";
import { getContent, recordOpen, getLocalNote } from "@/lib/local-reviewers";
import { startSync } from "@/lib/sync";
import { onLocalChange } from "@/lib/local-db";

export default function ViewerFrame() {
  useWakeLock(true); // screen stays awake while the viewer is open
  const pathname = usePathname();
  const segment = pathname?.split("/").filter(Boolean).pop() ?? "scratchpad";
  const reviewerId = segment === "scratchpad" ? null : decodeURIComponent(segment);

  const [notesOpen, setNotesOpen] = useState(reviewerId === null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [hasNotes, setHasNotes] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(reviewerId === null ? "ready" : "loading");

  useEffect(() => {
    if (reviewerId === null) return;
    let cancelled = false;
    setStatus("loading");
    startSync();
    async function load() {
      const html = await getContent(reviewerId!);
      if (cancelled) return;
      if (html === null) { setStatus("error"); return; }
      setHtmlContent(html);
      setStatus("ready");
      void recordOpen(reviewerId!);
    }
    void load();
    return () => { cancelled = true; };
  }, [reviewerId]);

  useEffect(() => {
    let cancelled = false;
    async function readNote() {
      const n = await getLocalNote(reviewerId ?? "scratchpad");
      if (!cancelled) setHasNotes(!!n && n.contentMd.trim().length > 0);
    }
    void readNote();
    const off = onLocalChange(() => { void readNote(); });
    return () => { cancelled = true; off(); };
  }, [reviewerId]);

  return (
    <div className="focus">
      <div className="vdoc">
        {reviewerId === null ? (
          <div className="docpage"><h1>Scratchpad</h1><p>Freeform notes. Jot anything down in the panel.</p></div>
        ) : status === "loading" ? (
          <div className="docpage"><p>Opening your reviewer…</p></div>
        ) : status === "error" ? (
          <div className="docpage"><p>This reviewer isn&rsquo;t on this device yet. Go online once and it downloads itself.</p></div>
        ) : (
          // allow-scripts only — NEVER allow-same-origin (uploaded HTML must not touch the app)
          <iframe className="reviewer-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={htmlContent ?? ""} title="Reviewer" />
        )}
      </div>
      <Link href="/" className="pill pback">← Desk</Link>
      <button type="button" className={`pill pnotes${hasNotes ? " has-notes" : ""}`} onClick={() => setNotesOpen((o) => !o)}>
        ✎ Notes
      </button>
      <NotesPanel reviewerId={reviewerId} open={notesOpen} onClose={() => setNotesOpen(false)} />
    </div>
  );
}
