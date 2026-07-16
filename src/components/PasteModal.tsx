"use client";

import { useState } from "react";
import { pasteTitle } from "@/lib/paste-title";
import { uploadOne } from "@/lib/upload-one";
import { MAX_BYTES } from "@/lib/validate-upload";

export default function PasteModal({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [titleDirty, setTitleDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onText(v: string) {
    setText(v);
    if (!titleDirty) setTitle(v.trim() ? pasteTitle(v) : "");
  }

  async function save() {
    if (busy) return;
    const body = text.trim();
    if (!body) { setErr("Paste some HTML first."); return; }
    if (new Blob([body]).size > MAX_BYTES) { setErr("That is over the 15 MB limit."); return; }
    setBusy(true); setErr(null);
    try {
      const finalTitle = (title.trim() || "Pasted reviewer").slice(0, 200);
      const safeName = (finalTitle.replace(/[^\w\- ]+/g, "").trim() || "pasted-reviewer") + ".html";
      const result = await uploadOne(safeName, body);
      if (!result.ok) { setErr(result.reason); return; }
      // The server names it from the pasted <title>; the edited field wins.
      if (result.title !== finalTitle) {
        await fetch(`/api/reviewers/${result.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: finalTitle }),
        }).catch(() => {});
      }
      onSaved(`Added "${finalTitle}" to your desk`);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Paste HTML</h3>
        <p className="modal-sub">Made a reviewer with Claude or copied one from anywhere? Paste the whole HTML here. No file needed.</p>
        <textarea
          className="paste-ta"
          value={text}
          onChange={(e) => onText(e.target.value)}
          placeholder={"<!doctype html>\n<html>…"}
          autoFocus
        />
        <label>Title <small>(auto-filled from the pasted content, editable)</small>
          <input value={title} maxLength={200} placeholder="Pasted reviewer"
            onChange={(e) => { setTitleDirty(true); setTitle(e.target.value); }} />
        </label>
        {err && <p className="modal-err">{err}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="solid" onClick={save} disabled={busy || !text.trim()}>
            {busy ? "Saving..." : "Save to desk"}
          </button>
        </div>
      </div>
    </div>
  );
}
