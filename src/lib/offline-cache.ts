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

// Remove reviewers' offline copies (page shell + content) from every cache.
// Used by the Settings storage readout; the SW re-precaches on the next
// online desk load, so this is always safe.
export async function evictReviewers(ids: string[]): Promise<void> {
  if (!("caches" in window) || ids.length === 0) return;
  const urls = ids.flatMap((id) => [`/viewer/${id}`, `/api/reviewers/${id}`]);
  const keys = await caches.keys();
  await Promise.all(
    keys.map(async (k) => {
      const c = await caches.open(k);
      await Promise.all(urls.map((u) => c.delete(u, { ignoreVary: true })));
    })
  );
}
