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
