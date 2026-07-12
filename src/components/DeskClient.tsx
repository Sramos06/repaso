"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UploadZone from "./UploadZone";
import ReviewerCard from "./ReviewerCard";
import AvatarMenu from "./AvatarMenu";

export type DeskReviewer = {
  id: string; title: string; subject: string | null; pinned: boolean; archived: boolean; date: string; hasNotes: boolean;
};

type Dialog =
  | { kind: "rename"; r: DeskReviewer }
  | { kind: "delete"; r: DeskReviewer }
  | { kind: "share"; r: DeskReviewer }
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentIds, setContentIds] = useState<Set<string>>(new Set());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "error">("idle");
  const searchSeq = useRef(0);

  const q = query.trim().toLowerCase();
  const matchTS = (r: DeskReviewer) => r.title.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q);

  // Content search: title/subject filtering stays instant; ≥3 chars also hits
  // the API and merges by id. Offline the fetch fails silently → title/subject only.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) { setContentIds(new Set()); return; }
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        if (seq !== searchSeq.current) return;
        if (res.ok) setContentIds(new Set(((await res.json()).ids ?? []) as string[]));
      } catch { /* offline: title/subject only */ }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const active = useMemo(() => reviewers.filter((r) => !r.archived), [reviewers]);
  const archived = useMemo(() => reviewers.filter((r) => r.archived), [reviewers]);
  const results = useMemo(
    () => (q ? reviewers.filter((r) => matchTS(r) || contentIds.has(r.id)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, reviewers, contentIds]
  );

  function say(msg: string) { setFlash(msg); setTimeout(() => setFlash(null), 2200); }

  async function call(id: string, init: RequestInit, okMsg: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviewers/${id}`, init);
      if (!res.ok) { const d = await res.json().catch(() => null); say(d?.error ?? "Something went wrong — try again."); return; }
      say(okMsg); setDialog(null); router.refresh();
    } catch { say("Could not reach the server — check your connection."); }
    finally { setBusy(false); }
  }

  const togglePin = (r: DeskReviewer) =>
    call(r.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !r.pinned }) }, r.pinned ? "Unpinned" : "Pinned to top");
  const toggleArchive = (r: DeskReviewer) =>
    call(r.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived: !r.archived }) }, r.archived ? "Back on the desk" : "Moved to the drawer");

  function openRename(r: DeskReviewer) { setDraftTitle(r.title); setDraftSubject(r.subject ?? ""); setDialog({ kind: "rename", r }); }
  const saveRename = () =>
    dialog?.kind === "rename" &&
    call(dialog.r.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: draftTitle, subject: draftSubject }) }, "Saved");
  const confirmDelete = () => dialog?.kind === "delete" && call(dialog.r.id, { method: "DELETE" }, "Deleted");

  async function openShare(r: DeskReviewer) {
    setDialog({ kind: "share", r }); setShareUrl(null); setShareStatus("loading");
    try {
      const res = await fetch(`/api/reviewers/${r.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      setShareUrl(`${window.location.origin}/s/${token}`); setShareStatus("idle");
    } catch { setShareStatus("error"); }
  }
  async function revokeShare() {
    if (dialog?.kind !== "share" || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviewers/${dialog.r.id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      say("Share link turned off"); setDialog(null);
    } catch { say("Couldn’t revoke — try again."); }
    finally { setBusy(false); }
  }
  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => say("Link copied"), () => say("Copy failed — select it manually"));
  }

  const menuProps = (r: DeskReviewer) => ({
    menuOpen: menuFor === r.id,
    onMenuToggle: () => setMenuFor(menuFor === r.id ? null : r.id),
    onPin: () => togglePin(r),
    onRename: () => { setMenuFor(null); openRename(r); },
    onArchive: () => { setMenuFor(null); toggleArchive(r); },
    onShare: () => { setMenuFor(null); openShare(r); },
    onDelete: () => { setMenuFor(null); setDialog({ kind: "delete", r }); },
  });

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

      {q ? (
        <>
          <div className="seclabel"><h3>Results</h3><div className="line" /><span className="count">{results.length} FOUND</span></div>
          <div className="cards">
            {results.map((r) => (
              <ReviewerCard key={r.id} r={r} contentHit={!matchTS(r) && contentIds.has(r.id)} {...menuProps(r)} />
            ))}
            {results.length === 0 && <p className="empty">Nothing matches that…</p>}
          </div>
        </>
      ) : (
        <>
          <div className="seclabel"><h3>On the desk</h3><div className="line" /><span className="count">{active.length} FILES</span></div>
          <div className="cards">
            {active.map((r) => <ReviewerCard key={r.id} r={r} {...menuProps(r)} />)}
            {active.length === 0 && <p className="empty">Drop your first reviewer above ↑</p>}
          </div>

          {archived.length > 0 && (
            <>
              <button type="button" className="drawer-toggle" onClick={() => setDrawerOpen((o) => !o)}>
                <span className={`chev${drawerOpen ? " open" : ""}`}>▸</span> In the drawer <span className="count">{archived.length}</span>
              </button>
              {drawerOpen && (
                <div className="cards drawer">
                  {archived.map((r) => <ReviewerCard key={r.id} r={r} {...menuProps(r)} />)}
                </div>
              )}
            </>
          )}
        </>
      )}

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

      {dialog?.kind === "share" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Share “{dialog.r.title}”</h3>
            <p className="modal-sub">Anyone with this link can view this one reviewer — read-only, no sign-in. Nothing else of yours is exposed, and you can turn the link off anytime.</p>
            {shareStatus === "loading" ? (
              <p className="modal-sub">Making a link…</p>
            ) : shareStatus === "error" ? (
              <p className="modal-sub">Couldn’t make a link — try again.</p>
            ) : (
              <div className="share-row">
                <input readOnly value={shareUrl ?? ""} onFocus={(e) => e.target.select()} aria-label="Share link" />
                <button type="button" className="solid" onClick={copyShare}>Copy</button>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="danger" onClick={revokeShare} disabled={busy || shareStatus !== "idle"}>Turn off link</button>
              <button type="button" className="ghost" onClick={() => setDialog(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {flash && <div className="toast on">{flash}</div>}
    </div>
  );
}
