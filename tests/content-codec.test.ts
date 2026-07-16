import { describe, it, expect } from "vitest";
import { encodeContent, decodeContent, utf8Bytes } from "../src/lib/content-codec";

describe("content codec", () => {
  it("round-trips a small HTML document", async () => {
    const raw = "<!doctype html><html><title>Stats</title><body><p>Hypothesis testing</p></body></html>";
    const enc = await encodeContent(raw);
    expect(enc.encoding).toBe("gzip");
    expect(await decodeContent(enc.payload, enc.encoding)).toBe(raw);
  });

  it("round-trips unicode content exactly", async () => {
    const raw = "<p>Repaso — ₱0 forever · 日本語 · emoji 🐣</p>";
    const enc = await encodeContent(raw);
    expect(await decodeContent(enc.payload, enc.encoding)).toBe(raw);
  });

  it("round-trips a multi-megabyte document (chunked base64 works)", async () => {
    const raw = "<div>" + "lorem ipsum dolor sit amet ".repeat(200_000) + "</div>"; // ~5.4 MB
    const enc = await encodeContent(raw);
    const back = await decodeContent(enc.payload, enc.encoding);
    expect(back.length).toBe(raw.length);
    expect(back).toBe(raw);
  });

  it("compresses repetitive HTML well below raw size", async () => {
    const raw = "<tr><td>row</td></tr>".repeat(50_000); // ~1 MB
    const enc = await encodeContent(raw);
    expect(utf8Bytes(enc.payload)).toBeLessThan(utf8Bytes(raw) / 4);
  });

  it("passes plain payloads through untouched", async () => {
    expect(await decodeContent("<p>hi</p>", "plain")).toBe("<p>hi</p>");
  });

  it("rejects corrupt gzip payloads instead of returning garbage", async () => {
    const bad = btoa("this is definitely not gzip bytes");
    await expect(decodeContent(bad, "gzip")).rejects.toThrow();
  });

  it("rejects non-base64 payloads", async () => {
    await expect(decodeContent("%%not-base64%%", "gzip")).rejects.toThrow();
  });

  it("counts utf8 bytes, not code units", () => {
    expect(utf8Bytes("abc")).toBe(3);
    expect(utf8Bytes("₱")).toBe(3);
  });
});
