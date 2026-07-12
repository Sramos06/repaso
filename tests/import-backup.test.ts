import { describe, it, expect } from "vitest";
import { parseBackup } from "../src/lib/import-backup";

const v2 = {
  app: "repaso", version: 2, exportedAt: "2026-07-11T00:00:00Z", scratchpad: "hi",
  reviewers: [{ title: "A", subject: "STAT", pinned: true, archived: false, htmlContent: "<p>a</p>", noteMd: "n" }],
};

describe("parseBackup", () => {
  it("accepts a v2 backup", () => {
    const r = parseBackup(v2);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.scratchpad).toBe("hi");
      expect(r.data.reviewers[0]).toEqual({ title: "A", subject: "STAT", pinned: true, archived: false, htmlContent: "<p>a</p>", noteMd: "n" });
    }
  });
  it("accepts a v1 backup, defaulting pinned/archived to false", () => {
    const v1 = { app: "repaso", version: 1, scratchpad: "", reviewers: [{ title: "B", subject: null, htmlContent: "<p>b</p>", noteMd: "" }] };
    const r = parseBackup(v1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reviewers[0]).toEqual({ title: "B", subject: null, pinned: false, archived: false, htmlContent: "<p>b</p>", noteMd: "" });
  });
  it("rejects non-objects, wrong app, unsupported version", () => {
    expect(parseBackup(null).ok).toBe(false);
    expect(parseBackup("x").ok).toBe(false);
    expect(parseBackup({ app: "other", version: 2, reviewers: [] }).ok).toBe(false);
    expect(parseBackup({ app: "repaso", version: 99, reviewers: [] }).ok).toBe(false);
  });
  it("skips malformed reviewer entries but keeps valid ones", () => {
    const r = parseBackup({ app: "repaso", version: 2, scratchpad: "", reviewers: [{ title: "ok", htmlContent: "<p/>" }, { title: 5 }, null, "x"] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reviewers).toHaveLength(1);
  });
});
