// Ask the active service worker to precache every reviewer's page shell + content
// so all of them open offline. Fire-and-forget; safe to call on every desk load.
export function precacheReviewers(ids: string[]): void {
  if (!("serviceWorker" in navigator) || ids.length === 0) return;
  navigator.serviceWorker.ready
    .then((reg) => {
      const urls = ids.flatMap((id) => [`/viewer/${id}`, `/api/reviewers/${id}`]);
      reg.active?.postMessage({ type: "precache", urls });
    })
    .catch(() => {});
}

// Which of these reviewers have their content cached (i.e. openable offline)?
export async function cachedReviewerIds(ids: string[]): Promise<Set<string>> {
  if (!("caches" in window)) return new Set();
  const hits = await Promise.all(
    ids.map(async (id) => ((await caches.match(`/api/reviewers/${id}`, { ignoreVary: true })) ? id : null))
  );
  return new Set(hits.filter((x): x is string => x !== null));
}

// After a reviewer's file is replaced, its offline copies are stale — and the
// SW precache handler skips URLs that are already cached, so without eviction
// the old file would be served offline forever. Evict, then re-precache.
export async function refreshReviewerCache(id: string): Promise<void> {
  if (!("caches" in window)) return;
  const urls = [`/viewer/${id}`, `/api/reviewers/${id}`];
  const keys = await caches.keys();
  await Promise.all(
    keys.map(async (k) => {
      const c = await caches.open(k);
      for (const u of urls) await c.delete(u, { ignoreVary: true });
    })
  );
  precacheReviewers([id]);
}
