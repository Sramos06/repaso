import { describe, it, expect } from "vitest";
import { shouldSnapshot, REVISION_WINDOW_MS, MAX_REVISIONS } from "../src/lib/note-revisions";

const NOW = new Date("2026-07-14T10:00:00Z");
const minsAgo = (m: number) => new Date(NOW.getTime() - m * 60_000);

describe("constants", () => {
  it("locks the spec values", () => {
    expect(REVISION_WINDOW_MS).toBe(600_000);
    expect(MAX_REVISIONS).toBe(30);
  });
});

describe("shouldSnapshot", () => {
  it("snapshots when there is no prior revision", () => {
    expect(shouldSnapshot("old text", "new text", null, NOW)).toBe(true);
  });
  it("skips when previous content is empty (nothing to preserve)", () => {
    expect(shouldSnapshot("", "new text", null, NOW)).toBe(false);
  });
  it("skips when content is unchanged", () => {
    expect(shouldSnapshot("same", "same", null, NOW)).toBe(false);
  });
  it("skips inside the 10-minute window", () => {
    expect(shouldSnapshot("old", "new", minsAgo(5), NOW)).toBe(false);
    expect(shouldSnapshot("old", "new", minsAgo(9), NOW)).toBe(false);
  });
  it("snapshots once the window has passed (boundary inclusive)", () => {
    expect(shouldSnapshot("old", "new", minsAgo(10), NOW)).toBe(true);
    expect(shouldSnapshot("old", "new", minsAgo(11), NOW)).toBe(true);
  });
});
