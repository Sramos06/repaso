"use client";

import { useState } from "react";
import NotesPanel from "./NotesPanel";

export default function ViewerFrame({ html, reviewerId }: { html: string | null; reviewerId: string | null }) {
  // scratchpad opens with notes shown; reviewer view starts closed
  const [notesOpen, setNotesOpen] = useState(reviewerId === null);

  return (
    <>
      <button className="notesbtn-floating" onClick={() => setNotesOpen((o) => !o)}>
        ✎ Notes
      </button>
      <div className="vbody">
        <div className="vdoc">
          {html === null ? (
            <div className="docpage"><h1>Scratchpad</h1><p>Freeform notes — jot anything down in the panel.</p></div>
          ) : (
            // allow-scripts only — NEVER allow-same-origin (uploaded HTML must not touch the app)
            <iframe className="reviewer-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} title="Reviewer" />
          )}
        </div>
        <NotesPanel reviewerId={reviewerId} open={notesOpen} />
      </div>
    </>
  );
}
