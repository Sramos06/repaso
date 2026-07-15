// One file per request (Vercel caps request bodies ~4.5 MB). Returns the
// server's verdict for exactly this file. Shared by the staging tray and
// the paste modal so both paths report the same honest reasons.
export async function uploadOne(
  file: File
): Promise<{ ok: true; id: string; title: string } | { ok: false; reason: string }> {
  const fd = new FormData();
  fd.append("files", file);
  try {
    const res = await fetch("/api/reviewers", { method: "POST", body: fd });
    if (res.status === 413) return { ok: false, reason: "Too large to upload." };
    const data = await res.json().catch(() => null);
    if (data?.created?.length) return { ok: true, id: data.created[0].id, title: data.created[0].title };
    const reason = data?.rejected?.[0]?.reason ?? data?.error ?? "Could not save this file. Try again.";
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: "Could not reach the server. Check your connection and try again." };
  }
}
