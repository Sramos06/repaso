import { describe, it, expect } from "vitest";
import { isLocalId, makeLocalId, diffRows, mergeNote, backoffMs, remapMutations, applyPatchLocal } from "../src/lib/sync-plan";
import type { LocalReviewer, ServerRow, QueuedMutation } from "../src/lib/local-types";

const srow = (id: string, updatedAt = "2026-07-16T00:00:00.000Z"): ServerRow => ({
  id, title: "T", subject: null, pinned: false, archivedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt, lastOpenedAt: null, sizeBytes: 10, hasNotes: false,
});
const lrow = (id: string, over: Partial<LocalReviewer> = {}): LocalReviewer => ({
  id, title: "T", subject: null, pinned: false, archivedAt: null,
  createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-16T00:00:00.000Z", lastOpenedAt: null,
  sizeBytes: 10, payload: "x", encoding: "gzip", hasNotes: false, pending: false, ...over,
});

describe("local ids", () => {
  it("makeLocalId produces ids isLocalId recognizes and uuids are not local", () => {
    expect(isLocalId(makeLocalId())).toBe(true);
    expect(isLocalId("14fa8a2e-9159-4bd0-82cb-50db3b76addd")).toBe(false);
  });
});

describe("diffRows", () => {
  it("new server rows need a content fetch", () => {
    const plan = diffRows([srow("a")], []);
    expect(plan.fetchIds).toEqual(["a"]);
    expect(plan.deleteIds).toEqual([]);
    expect(plan.metaOnly).toEqual([]);
  });
  it("changed updatedAt is metadata-only (content is immutable after upload)", () => {
    const plan = diffRows([srow("a", "2026-07-17T00:00:00.000Z")], [lrow("a")]);
    expect(plan.fetchIds).toEqual([]);
    expect(plan.metaOnly.map((r) => r.id)).toEqual(["a"]);
  });
  it("unchanged rows produce no work", () => {
    const plan = diffRows([srow("a")], [lrow("a")]);
    expect(plan.fetchIds).toEqual([]);
    expect(plan.metaOnly).toEqual([]);
    expect(plan.deleteIds).toEqual([]);
  });
  it("local rows gone from the server are deleted, but pending rows are protected", () => {
    const plan = diffRows([], [lrow("gone"), lrow("local-1", { pending: true })]);
    expect(plan.deleteIds).toEqual(["gone"]);
  });
});

describe("mergeNote", () => {
  it("keeps both texts with a divider", () => {
    const merged = mergeNote("server text", "local text", "2026-07-16T10:00:00.000Z");
    expect(merged).toContain("server text");
    expect(merged).toContain("local text");
    expect(merged.indexOf("server text")).toBeLessThan(merged.indexOf("local text"));
    expect(merged).toContain("Kept from this device");
  });
  it("returns local text alone when the server text is empty", () => {
    expect(mergeNote("", "local", "2026-07-16T10:00:00.000Z")).toBe("local");
  });
  it("returns server text alone when the local text is empty", () => {
    expect(mergeNote("server", "", "2026-07-16T10:00:00.000Z")).toBe("server");
  });
  it("identical texts merge to themselves (crash-resend must not self-duplicate)", () => {
    expect(mergeNote("same text", "same text", "2026-07-16T10:00:00.000Z")).toBe("same text");
    expect(mergeNote(" same text ", "same text", "2026-07-16T10:00:00.000Z")).toBe("same text");
  });
});

describe("backoffMs", () => {
  it("doubles and caps at 60s", () => {
    expect(backoffMs(0)).toBe(1000);
    expect(backoffMs(1)).toBe(2000);
    expect(backoffMs(3)).toBe(8000);
    expect(backoffMs(10)).toBe(60000);
  });
});

describe("remapMutations", () => {
  it("rewrites every reference to the temp id", () => {
    const list: QueuedMutation[] = [
      { kind: "patch", id: "local-1", patch: { pinned: true }, seq: 2, attempts: 0 },
      { kind: "note", target: "local-1", contentMd: "x", baseUpdatedAt: null, seq: 3, attempts: 0 },
      { kind: "open", id: "local-1", seq: 4, attempts: 0 },
      { kind: "delete", id: "other", seq: 5, attempts: 0 },
    ];
    const out = remapMutations(list, "local-1", "real-9");
    expect(out[0]).toMatchObject({ kind: "patch", id: "real-9" });
    expect(out[1]).toMatchObject({ kind: "note", target: "real-9" });
    expect(out[2]).toMatchObject({ kind: "open", id: "real-9" });
    expect(out[3]).toMatchObject({ kind: "delete", id: "other" });
  });
});

describe("applyPatchLocal", () => {
  it("maps archived to archivedAt and stamps updatedAt", () => {
    const row = lrow("a");
    const out = applyPatchLocal(row, { archived: true, title: "New" }, "2026-07-18T00:00:00.000Z");
    expect(out.archivedAt).toBe("2026-07-18T00:00:00.000Z");
    expect(out.title).toBe("New");
    expect(out.updatedAt).toBe("2026-07-18T00:00:00.000Z");
    expect(applyPatchLocal(out, { archived: false }, "2026-07-19T00:00:00.000Z").archivedAt).toBeNull();
  });
});
