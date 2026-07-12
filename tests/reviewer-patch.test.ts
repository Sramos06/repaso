import { describe, it, expect } from "vitest";
import { parseReviewerPatch } from "../src/lib/reviewer-patch";

describe("parseReviewerPatch", () => {
  it("accepts a title rename and trims it", () => {
    expect(parseReviewerPatch({ title: "  Stats Final  " })).toEqual({ ok: true, patch: { title: "Stats Final" } });
  });
  it("rejects an empty or overlong title", () => {
    expect(parseReviewerPatch({ title: "   " }).ok).toBe(false);
    expect(parseReviewerPatch({ title: "x".repeat(201) }).ok).toBe(false);
  });
  it("normalizes blank subject to null and caps at 40 chars", () => {
    expect(parseReviewerPatch({ subject: "  " })).toEqual({ ok: true, patch: { subject: null } });
    expect(parseReviewerPatch({ subject: "STAT 023" })).toEqual({ ok: true, patch: { subject: "STAT 023" } });
    expect(parseReviewerPatch({ subject: "x".repeat(41) }).ok).toBe(false);
  });
  it("accepts a pin toggle and rejects non-boolean", () => {
    expect(parseReviewerPatch({ pinned: true })).toEqual({ ok: true, patch: { pinned: true } });
    expect(parseReviewerPatch({ pinned: "yes" }).ok).toBe(false);
  });
  it("rejects an empty patch and non-object bodies", () => {
    expect(parseReviewerPatch({}).ok).toBe(false);
    expect(parseReviewerPatch(null).ok).toBe(false);
    expect(parseReviewerPatch("title=x").ok).toBe(false);
  });
  it("ignores unknown fields", () => {
    expect(parseReviewerPatch({ title: "A", htmlContent: "<hack>" })).toEqual({ ok: true, patch: { title: "A" } });
  });
  it("maps archived:true to an archivedAt Date and archived:false to null", () => {
    const on = parseReviewerPatch({ archived: true });
    expect(on.ok).toBe(true);
    if (on.ok) expect(on.patch.archivedAt).toBeInstanceOf(Date);
    expect(parseReviewerPatch({ archived: false })).toEqual({ ok: true, patch: { archivedAt: null } });
  });
  it("rejects a non-boolean archived", () => {
    expect(parseReviewerPatch({ archived: "yes" }).ok).toBe(false);
  });
});
