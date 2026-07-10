import { describe, it, expect } from "vitest";
import { validateUpload, MAX_BYTES } from "../src/lib/validate-upload";

describe("validateUpload", () => {
  it("accepts .html and extracts <title>", () => {
    const r = validateUpload("stat.html", 500, "<html><head><title>Hypothesis Testing</title></head></html>");
    expect(r).toEqual({ ok: true, title: "Hypothesis Testing" });
  });
  it("accepts .htm and falls back to filename when no <title>", () => {
    const r = validateUpload("STAT-023-reviewer.htm", 500, "<p>hi</p>");
    expect(r).toEqual({ ok: true, title: "STAT-023-reviewer" });
  });
  it("rejects other extensions", () => {
    const r = validateUpload("notes.pdf", 500, "%PDF");
    expect(r).toEqual({ ok: false, reason: "Only .html or .htm files are allowed." });
  });
  it("rejects files over 4 MB", () => {
    const r = validateUpload("big.html", MAX_BYTES + 1, "<p></p>");
    expect(r).toEqual({ ok: false, reason: "File is over the 4 MB limit." });
  });
  it("rejects empty content", () => {
    const r = validateUpload("empty.html", 0, "   ");
    expect(r).toEqual({ ok: false, reason: "File is empty." });
  });
  it("trims and caps extracted titles at 200 chars", () => {
    const long = "x".repeat(300);
    const r = validateUpload("a.html", 500, `<title>  ${long}  </title>`);
    expect(r.ok && r.title.length === 200).toBe(true);
  });
});
