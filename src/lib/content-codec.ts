// Isomorphic content codec (browser + Node both have these APIs natively).
// Reviewers are stored gzip-compressed as base64 text; 'plain' is the
// permanent fallback for browsers without CompressionStream.

export type Encoding = "plain" | "gzip";

export function utf8Bytes(s: string): number {
  return new TextEncoder().encode(s).length;
}

// btoa/atob work on binary strings; multi-MB inputs must be chunked so
// String.fromCharCode never receives millions of spread arguments.
const CHUNK = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

// Return type stays the narrow Uint8Array<ArrayBuffer> so Blob accepts it
// under TS 5.9's generic typed arrays without a defensive copy.
function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64); // throws on invalid base64
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function encodeContent(raw: string): Promise<{ payload: string; encoding: Encoding }> {
  if (typeof CompressionStream === "undefined") return { payload: raw, encoding: "plain" };
  const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  return { payload: bytesToBase64(bytes), encoding: "gzip" };
}

export async function decodeContent(payload: string, encoding: string): Promise<string> {
  if (encoding !== "gzip") return payload;
  const bytes = base64ToBytes(payload);
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text(); // rejects on corrupt gzip
}

// Decompresses with a hard output cap so a malicious "gzip bomb" payload
// cannot balloon into gigabytes of memory. Server-side uploads use this;
// trusted read paths keep decodeContent.
export async function decodeContentBounded(payload: string, encoding: string, maxBytes: number): Promise<string> {
  if (encoding !== "gzip") return payload;
  const bytes = base64ToBytes(payload);
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Decompressed size exceeds limit");
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { all.set(c, off); off += c.length; }
  return new TextDecoder().decode(all);
}
