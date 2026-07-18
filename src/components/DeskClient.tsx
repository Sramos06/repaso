"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import UploadZone from "./UploadZone";
import ReviewerCard from "./ReviewerCard";
import AvatarMenu from "./AvatarMenu";
import CommandPalette from "./CommandPalette";
import { downloadText, htmlFilename } from "@/lib/download-file";
import { exportBackup } from "@/lib/export-backup";
import { getDeskRows, localPatch, localDelete, localDuplicate, localToggle, getContent } from "@/lib/local-reviewers";
import { startSync, pendingWorkCount, isHydrated } from "@/lib/sync";
import { onLocalChange, localStoreAvailable } from "@/lib/local-db";
import type { LocalReviewer } from "@/lib/local-types";

export type DeskReviewer = {
  id: string; title: string; subject: string | null; pinned: boolean; archived: boolean;
  lastOpenedAt: string | null; date: string; hasNotes: boolean; pendingSync: boolean; uploadFailed: boolean;
};

type Dialog =
  | { kind: "rename"; r: DeskReviewer }
  | { kind: "delete"; r: DeskReviewer }
  | { kind: "send"; r: DeskReviewer }
  | { kind: "bulkdelete" }
  | null;

export default function DeskClient({ email }: { email: string }) {
  const [query, setQuery] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentHits, setContentHits] = useState<Map<string, string>>(new Map());
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "error">("idle");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<LocalReviewer[] | null>(null); // null = first IDB read pending
  const [waiting, setWaiting] = useState(0); // outbox depth
  const [hydrated, setHydrated] = useState(true); // default true: returning users never flash "preparing"
  const [storeAvailable, setStoreAvailable] = useState<boolean | null>(null); // null = check pending
  const searchSeq = useRef(0);
  const shareSeq = useRef(0);

  const q = query.trim().toLowerCase();
  const term = query.trim();
  const matchTS = (r: DeskReviewer) => r.title.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q);

  // Content search → id→snippet map. title/subject stays instant; ≥3 chars hits the API.
  useEffect(() => {
    const t = query.trim();
    const seq = ++searchSeq.current;
    if (t.length < 3) { setContentHits(new Map()); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(t)}`);
        if (seq !== searchSeq.current) return;
        if (res.ok) {
          const data = await res.json();
          setContentHits(new Map(((data.results ?? []) as { id: string; snippet: string }[]).map((x) => [x.id, x.snippet])));
        }
      } catch { /* offline: title/subject only */ }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // Ctrl/Cmd-K opens the command palette.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setPaletteOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The desk reads from the device's local store, not a server prop: first
  // paint comes from IndexedDB, then this effect keeps it live via the local
  // change channel while startSync() reconciles with the cloud in the background.
  useEffect(() => {
    let cancelled = false;
    async function readLocal() {
      const [r, w] = await Promise.all([getDeskRows(), pendingWorkCount()]);
      if (!cancelled) { setRows(r); setWaiting(w); setHydrated(await isHydrated()); }
    }
    readLocal();
    startSync();
    localStoreAvailable().then((ok) => { if (!cancelled) setStoreAvailable(ok); });
    const off = onLocalChange(() => { void readLocal(); });
    return () => { cancelled = true; off(); };
  }, []);

  const reviewers: DeskReviewer[] = useMemo(
    () => (rows ?? []).map((r) => ({
      id: r.id, title: r.title, subject: r.subject, pinned: r.pinned,
      archived: r.archivedAt !== null, lastOpenedAt: r.lastOpenedAt,
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      hasNotes: r.hasNotes, pendingSync: r.pending, uploadFailed: r.uploadFailed ?? false,
    })),
    [rows]
  );

  const active = useMemo(() => reviewers.filter((r) => !r.archived), [reviewers]);
  const archived = useMemo(() => reviewers.filter((r) => r.archived), [reviewers]);
  const recent = useMemo(
    () => reviewers.filter((r) => !r.archived && r.lastOpenedAt).sort((a, b) => (a.lastOpenedAt! < b.lastOpenedAt! ? 1 : -1)).slice(0, 4),
    [reviewers]
  );
  const results = useMemo(
    () => (q ? reviewers.filter((r) => matchTS(r) || contentHits.has(r.id)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, reviewers, contentHits]
  );

  function say(msg: string) { setFlash(msg); setTimeout(() => setFlash(null), 2200); }

  const togglePin = async (r: DeskReviewer) => { const v = await localToggle(r.id, "pinned"); if (v !== null) say(v ? "Pinned to top" : "Unpinned"); };
  const toggleArchive = async (r: DeskReviewer) => { const v = await localToggle(r.id, "archived"); if (v !== null) say(v ? "Moved to the drawer" : "Back on the desk"); };

  async function downloadReviewer(r: DeskReviewer) {
    if (busy) return;
    setBusy(true);
    try {
      const html = await getContent(r.id);
      if (html === null) { say("Not on this device yet. Go online once and try again."); return; }
      downloadText(htmlFilename(r.title), html);
      say("Downloaded");
    } finally { setBusy(false); }
  }

  const duplicateReviewer = (r: DeskReviewer) => { void localDuplicate(r.id); say("Duplicated"); };

  function toggleManaging() {
    setManaging((m) => !m);
    setSelected(new Set());
  }
  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function bulkArchive() {
    if (selected.size === 0) return;
    for (const id of selected) void localPatch(id, { archived: true });
    say(`Moved ${selected.size} to the drawer`); toggleManaging();
  }
  async function bulkExport() {
    if (busy || selected.size === 0) return;
    setBusy(true);
    try { await exportBackup([...selected]); say(`Exported ${selected.size}`); }
    catch (e) { say(e instanceof Error ? e.message : "Export failed. Try again."); }
    finally { setBusy(false); }
  }
  function bulkDelete() {
    if (selected.size === 0) return;
    for (const id of selected) void localDelete(id);
    say(`Deleted ${selected.size}`); setDialog(null); toggleManaging();
  }

  function openRename(r: DeskReviewer) { setDraftTitle(r.title); setDraftSubject(r.subject ?? ""); setDialog({ kind: "rename", r }); }
  const saveRename = () => {
    if (dialog?.kind !== "rename") return;
    void localPatch(dialog.r.id, { title: draftTitle, subject: draftSubject });
    say("Saved"); setDialog(null);
  };
  const confirmDelete = () => {
    if (dialog?.kind !== "delete") return;
    void localDelete(dialog.r.id);
    say("Deleted"); setDialog(null);
  };

  async function openSend(r: DeskReviewer) {
    if (r.uploadFailed) { say("This file couldn’t back up. Download a copy and add it again."); return; }
    if (r.pendingSync) { say("This file hasn’t backed up yet. Try again once it has."); return; }
    const seq = ++shareSeq.current;
    setDialog({ kind: "send", r }); setShareUrl(null); setShareStatus("loading");
    try {
      const res = await fetch(`/api/reviewers/${r.id}/share`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      if (seq !== shareSeq.current) return;
      setShareUrl(`${window.location.origin}/s/${token}`); setShareStatus("idle");
    } catch { if (seq === shareSeq.current) setShareStatus("error"); }
  }
  async function revokeShare() {
    if (dialog?.kind !== "send" || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reviewers/${dialog.r.id}/share`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      say("Share link turned off"); setDialog(null);
    } catch { say("Couldn’t revoke. Try again."); }
    finally { setBusy(false); }
  }
  function copyShare() {
    if (!shareUrl) return;
    navigator.clipboard?.writeText(shareUrl).then(() => say("Link copied"), () => say("Copy failed. Select it manually"));
  }

  const menuProps = (r: DeskReviewer) => ({
    menuOpen: menuFor === r.id,
    pendingSync: r.pendingSync,
    uploadFailed: r.uploadFailed,
    managing,
    selected: selected.has(r.id),
    onToggleSelect: () => toggleSelect(r.id),
    onMenuToggle: () => setMenuFor(menuFor === r.id ? null : r.id),
    onPin: () => { setMenuFor(null); togglePin(r); },
    onRename: () => { setMenuFor(null); openRename(r); },
    onArchive: () => { setMenuFor(null); toggleArchive(r); },
    onDuplicate: () => { setMenuFor(null); duplicateReviewer(r); },
    onSend: () => { setMenuFor(null); openSend(r); },
    onDelete: () => { setMenuFor(null); setDialog({ kind: "delete", r }); },
  });

  return (
    <div className={`app${managing ? " managing" : ""}`} onClick={() => setMenuFor(null)}>
      <header>
        <div className="brand"><h1>Repa<em>so</em></h1></div>
        <div className="search">
          <svg fill="none" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round"><circle cx="11" cy="11" r="7" stroke="currentColor" fill="none" /><path d="M21 21l-4.3-4.3" stroke="currentColor" /></svg>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your reviewers…" aria-label="Search reviewers" />
        </div>
        <AvatarMenu email={email} />
      </header>

      {storeAvailable === false && (
        <p className="empty">This browser can’t store Repaso’s data, so offline use and saving won’t work here. Try a current version of Chrome, Edge, or Safari.</p>
      )}

      <UploadZone />

      {q ? (
        <>
          <div className="seclabel"><h3>Results</h3><div className="line" /><span className="count">{results.length} FOUND</span></div>
          <div className="cards">
            {results.map((r) => (
              <ReviewerCard key={r.id} r={r} contentHit={!matchTS(r) && contentHits.has(r.id)} snippet={contentHits.get(r.id)} term={term} {...menuProps(r)} />
            ))}
            {results.length === 0 && <p className="empty">Nothing matches that…</p>}
          </div>
        </>
      ) : (
        <>
          {recent.length > 0 && (
            <>
              <div className="seclabel"><h3>Continue studying</h3><div className="line" /></div>
              <div className="recent-row">
                {recent.map((r) => (
                  <Link key={r.id} href={`/viewer/${r.id}`} className="recent-chip">
                    {r.subject && <span className="rs">{r.subject}</span>}
                    <span className="rt">{r.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="seclabel">
            <h3>On the desk</h3><div className="line" />
            <button type="button" className={`selbtn${managing ? " on" : ""}`} onClick={toggleManaging}>{managing ? "✕ Done" : "☑ Select"}</button>
            <span className="count">{active.length} FILES</span>
            {waiting > 0 && <span className="syncflag" title="Changes on this device that back up when online">☁ {waiting} to back up</span>}
          </div>
          <div className="cards">
            {active.map((r) => <ReviewerCard key={r.id} r={r} {...menuProps(r)} />)}
            {rows === null ? (
              <p className="empty">Opening your desk…</p>
            ) : active.length === 0 ? (
              <p className="empty">{!hydrated && navigator.onLine ? "Preparing your offline copy…" : navigator.onLine ? "Drop your first reviewer above ↑" : "Nothing on this device yet. Go online once and your desk downloads itself."}</p>
            ) : null}
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

      <div className={`bulkbar${managing && selected.size > 0 ? " on" : ""}`}>
        <span><b>{selected.size}</b> selected</span>
        <button type="button" onClick={bulkArchive} disabled={busy}>🗄 Archive</button>
        <button type="button" onClick={bulkExport} disabled={busy}>📦 Export</button>
        <button type="button" className="bulkdel" onClick={() => setDialog({ kind: "bulkdelete" })} disabled={busy}>🗑 Delete</button>
      </div>

      <Link href="/viewer/scratchpad" className="fab">✎ Scratchpad</Link>

      {paletteOpen && (
        <CommandPalette items={reviewers.map((r) => ({ id: r.id, title: r.title, subject: r.subject }))} onClose={() => setPaletteOpen(false)} />
      )}

      {dialog?.kind === "rename" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rename reviewer</h3>
            <label>Title
              <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} maxLength={200} autoFocus />
            </label>
            <label>Subject <small>(optional, shows on the card)</small>
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

      {dialog?.kind === "bulkdelete" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {selected.size} reviewer{selected.size === 1 ? "" : "s"}?</h3>
            <p className="modal-sub">The files and their notes are removed for good. Copies on your device are untouched.</p>
            <div className="modal-actions">
              <button type="button" className="ghost" onClick={() => setDialog(null)}>Keep them</button>
              <button type="button" className="danger" onClick={bulkDelete} disabled={busy}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {dialog?.kind === "send" && (
        <div className="overlay" onClick={() => setDialog(null)}>
          <div className="modal sendsheet" onClick={(e) => e.stopPropagation()}>
            <h3>Send “{dialog.r.title}”</h3>
            <p className="modal-sub">Anyone with the link can view this one reviewer. Read-only, no sign-in, and you can turn it off anytime.</p>
            {shareStatus === "loading" ? (
              <p className="modal-sub">Making a link…</p>
            ) : shareStatus === "error" ? (
              <p className="modal-sub">Couldn’t make a link. Try again.</p>
            ) : (
              <>
                <div className="share-row">
                  <input readOnly value={shareUrl ?? ""} onFocus={(e) => e.target.select()} aria-label="Share link" />
                  <button type="button" className="solid" onClick={copyShare}>Copy</button>
                </div>
                <div className="send-acts">
                  {"share" in navigator && (
                    <button type="button" className="send-act" onClick={() => { if (shareUrl) navigator.share({ title: dialog.r.title, url: shareUrl }).catch(() => {}); }}>
                      <span className="big">📲</span>Send via…
                    </button>
                  )}
                  <button type="button" className="send-act" onClick={() => downloadReviewer(dialog.r)}>
                    <span className="big">⬇</span>Download file
                  </button>
                </div>
              </>
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
