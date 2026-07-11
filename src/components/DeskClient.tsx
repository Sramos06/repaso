"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadZone from "./UploadZone";
import ReviewerCard from "./ReviewerCard";
import AvatarMenu from "./AvatarMenu";

export type DeskReviewer = {
  id: string; title: string; subject: string | null; pinned: boolean; date: string; hasNotes: boolean;
};

type Dialog =
  | { kind: "rename"; r: DeskReviewer }
  | { kind: "delete"; r: DeskReviewer }
  | null;

export default function DeskClient({ reviewers, email }: { reviewers: DeskReviewer[]; email: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviewers;
    return reviewers.filter((r) => r.title.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q));
  }, [query, reviewers]);

  function say(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2200);
  }

  async function call(id: string, init: RequestInit, okMsg: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviewers/${id}`, init);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        say(data?.error ?? "Something went wrong — try again.");
        return;
      }
      say(okMsg);
      setDialog(null);
      router.refresh();
    } catch {
      say("Could not reach the server — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  const togglePin = (r: DeskReviewer) =>
    call(r.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !r.pinned }) }, r.pinned ? "Unpinned" : "Pinned to top");

  function openRename(r: DeskReviewer) {
    setDraftTitle(r.title);
    setDraftSubject(r.subject ?? "");
    setDialog({ kind: "rename", r });
  }

  const saveRename = () =>
    dialog?.kind === "rename" &&
    call(dialog.r.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draftTitle, subject: draftSubject }) }, "Saved");

  const confirmDelete = () =>
    dialog?.kind === "delete" && call(dialog.r.id, { method: "DELETE" }, "Deleted");

  return (
    <div className="app" onClick={() => setMenuFor(null)}>
      <header>
        <div className="brand"><h1>Repa<em>so</em></h1></div>
        <div className="search">
          <svg fill="none" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" /><path d="M21 21l-4.3-4.3" stroke="currentColor" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your reviewers…" aria-label="Search reviewers" />
        </div>
        <AvatarMenu email={email} />
      </header>

      <UploadZone />

      <div className="seclabel"><h3>On the desk</h3><div className="line" /><span className="count">{reviewers.length} FILES</span></div>
      <div className="cards">
        {shown.map((r) => (
          <ReviewerCard
            key={r.id}
            r={r}
            menuOpen={menuFor === r.id}
            onMenuToggle={() => setMenuFor(menuFor === r.id ? null : r.id)}
            onPin={() => togglePin(r)}
            onRename={() => { setMenuFor(null); openRename(r); }}
            onDelete={() => { setMenuFor(null); setDialog({ kind: "delete", r }); }}
          />
        ))}
        {shown.length === 0 && <p className="empty">{query ? "Nothing on the desk matches that…" : "Drop your first reviewer above ↑"}</p>}
      </div>

      <Link href="/viewer/scratchpad" className="fab">✎ Scratchpad</Link>

      {dialog?.kind === "rename" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rename reviewer</h3>
            <label>Title
              <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} maxLength={200} autoFocus />
            </label>
            <label>Subject <small>(optional — shows on the card)</small>
              <input value={draftSubject} onChange={(e) => setDraftSubject(e.target.value)} maxLength={40} placeholder="STAT 023" />
            </label>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setDialog(null)}>Cancel</button>
              <button type="button" className="solid" onClick={saveRename} disabled={busy || !draftTitle.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}

      {dialog?.kind === "delete" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete “{dialog.r.title}”?</h3>
            <p className="modal-sub">The file and its notes are removed for good. Your original copy on your device is untouched.</p>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setDialog(null)}>Keep it</button>
              <button type="button" className="danger" onClick={confirmDelete} disabled={busy}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {flash && <div className="toast on">{flash}</div>}
    </div>
  );
}
