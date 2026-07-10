"use client";

import { useEffect, useState } from "react";
import NotesPanel from "./NotesPanel";

export default function ViewerFrame({ reviewerId }: { reviewerId: string | null }) {
  // scratchpad opens with notes shown; reviewer view starts closed
  const [notesOpen, setNotesOpen] = useState(reviewerId === null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(reviewerId === null ? "ready" : "loading");

  useEffect(() => {
    if (reviewerId === null) return;
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/reviewers/${reviewerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setHtmlContent(data.htmlContent);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reviewerId]);

  return (
    <>
      <button className="notesbtn-floating" onClick={() => setNotesOpen((o) => !o)}>
        ✎ Notes
      </button>
      <div className="vbody">
        <div className="vdoc">
          {reviewerId === null ? (
            <div className="docpage"><h1>Scratchpad</h1><p>Freeform notes — jot anything down in the panel.</p></div>
          ) : status === "loading" ? (
            <div className="docpage"><p>Opening your reviewer…</p></div>
          ) : status === "error" ? (
            <div className="docpage"><p>Could not load this reviewer — check your connection and try again.</p></div>
          ) : (
            // allow-scripts only — NEVER allow-same-origin (uploaded HTML must not touch the app)
            <iframe className="reviewer-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={htmlContent ?? ""} title="Reviewer" />
          )}
        </div>
        <NotesPanel reviewerId={reviewerId} open={notesOpen} />
      </div>
    </>
  );
}
