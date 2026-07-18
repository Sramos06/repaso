// Pure, testable shape-check for the JSON upload body. Size and content
// validation happen later, after decode, in the route.

type UploadBody = { ok: true; name: string; encoding: "plain" | "gzip"; payload: string } | { ok: false; reason: string };

export function parseUploadBody(body: unknown): UploadBody {
  if (typeof body !== "object" || body === null) return { ok: false, reason: "Bad upload request." };
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name) return { ok: false, reason: "Bad upload request." };
  if (b.encoding !== "plain" && b.encoding !== "gzip") return { ok: false, reason: "Bad upload request." };
  if (typeof b.payload !== "string") return { ok: false, reason: "Bad upload request." };
  return { ok: true, name: b.name, encoding: b.encoding, payload: b.payload };
}
