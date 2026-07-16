import { encodeContent, utf8Bytes } from "./content-codec";
import { MAX_BYTES, MAX_WIRE_BYTES, WIRE_LIMIT_REASON } from "./validate-upload";

// One file per request (Vercel caps request bodies ~4.5 MB). Compresses in the
// browser, then sends {name, encoding, payload} as JSON. Shared by the staging
// tray, the paste modal, and import so all paths report the same honest reasons.
export async function uploadOne(
  name: string,
  raw: string
): Promise<{ ok: true; id: string; title: string } | { ok: false; reason: string }> {
  if (utf8Bytes(raw) > MAX_BYTES) return { ok: false, reason: "File is over the 15 MB limit." };
  let payload: string;
  let encoding: string;
  try {
    ({ payload, encoding } = await encodeContent(raw));
    if (utf8Bytes(payload) > MAX_WIRE_BYTES) {
      return {
        ok: false,
        reason: encoding === "gzip"
          ? WIRE_LIMIT_REASON
          : "Files over 4 MB need a browser that supports compression. Update your browser and try again.",
      };
    }
  } catch {
    return { ok: false, reason: "Could not read this file. Try again." };
  }
  try {
    const res = await fetch("/api/reviewers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, encoding, payload }),
    });
    if (res.status === 413) return { ok: false, reason: "Too large to upload." };
    const data = await res.json().catch(() => null);
    if (data?.created?.length) return { ok: true, id: data.created[0].id, title: data.created[0].title };
    const reason = data?.rejected?.[0]?.reason ?? data?.error ?? "Could not save this file. Try again.";
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: "Could not reach the server. Check your connection and try again." };
  }
}
