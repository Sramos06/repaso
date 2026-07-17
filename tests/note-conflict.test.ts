import { describe, it, expect } from "vitest";
import { noteConflict } from "../src/lib/note-conflict";

const t1 = new Date("2026-07-16T10:00:00.000Z");
const t2 = new Date("2026-07-16T11:00:00.000Z");

describe("noteConflict", () => {
  it("absent base = legacy unguarded write, never conflicts", () => {
    expect(noteConflict(t2, "text", undefined)).toBe(false);
    expect(noteConflict(null, "", undefined)).toBe(false);
  });
  it("null base conflicts only with an existing non-empty note", () => {
    expect(noteConflict(t1, "existing text", null)).toBe(true);
    expect(noteConflict(t1, "", null)).toBe(false);
    expect(noteConflict(null, "", null)).toBe(false);
  });
  it("string base conflicts when the server copy is strictly newer", () => {
    expect(noteConflict(t2, "text", t1.toISOString())).toBe(true);
    expect(noteConflict(t1, "text", t1.toISOString())).toBe(false);
    expect(noteConflict(t1, "text", t2.toISOString())).toBe(false);
  });
  it("no existing row never conflicts", () => {
    expect(noteConflict(null, "", "2026-07-16T10:00:00.000Z")).toBe(false);
  });
  it("garbage base string is treated as unguarded (never blocks a save)", () => {
    expect(noteConflict(t2, "text", "not-a-date")).toBe(false);
  });
});
