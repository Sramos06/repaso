import { describe, it, expect } from "vitest";
import { parseUploadBody } from "../src/lib/upload-body";

describe("parseUploadBody", () => {
  it("accepts a valid gzip body", () => {
    const r = parseUploadBody({ name: "a.html", encoding: "gzip", payload: "H4sI..." });
    expect(r).toEqual({ ok: true, name: "a.html", encoding: "gzip", payload: "H4sI..." });
  });
  it("accepts a valid plain body", () => {
    const r = parseUploadBody({ name: "a.html", encoding: "plain", payload: "<p>hi</p>" });
    expect(r.ok).toBe(true);
  });
  it("rejects null, non-objects, and missing fields", () => {
    for (const bad of [null, "x", 5, {}, { name: "a.html" }, { name: "a.html", encoding: "gzip" }]) {
      expect(parseUploadBody(bad).ok).toBe(false);
    }
  });
  it("rejects unknown encodings", () => {
    expect(parseUploadBody({ name: "a.html", encoding: "br", payload: "x" }).ok).toBe(false);
  });
  it("rejects non-string name or payload", () => {
    expect(parseUploadBody({ name: 5, encoding: "plain", payload: "x" }).ok).toBe(false);
    expect(parseUploadBody({ name: "a.html", encoding: "plain", payload: 5 }).ok).toBe(false);
  });
});
