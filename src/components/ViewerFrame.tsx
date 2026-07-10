"use client";

export default function ViewerFrame({ html, reviewerId }: { html: string | null; reviewerId: string | null }) {
  return (
    <div className="vbody">
      <div className="vdoc">
        {html === null ? (
          <div className="docpage"><h1>Scratchpad</h1><p>Notes panel arrives in the next task.</p></div>
        ) : (
          // allow-scripts only — NEVER allow-same-origin (uploaded HTML must not touch the app)
          <iframe className="reviewer-frame" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={html} title="Reviewer" />
        )}
      </div>
      {/* NotesPanel mounts here in Task 10 */}
    </div>
  );
}
