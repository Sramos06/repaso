import { describe, it, expect } from "vitest";
import { dayKey, addDays, bucketByDay, streaks, daysInLast30, heatLevel } from "../src/lib/stats-calc";

describe("dayKey / addDays", () => {
  it("formats local dates and steps across month boundaries", () => {
    expect(dayKey(new Date(2026, 6, 17))).toBe("2026-07-17");
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("bucketByDay", () => {
  it("buckets ISO instants into local days with counts", () => {
    const base = new Date(2026, 6, 17, 9, 0).toISOString();
    const later = new Date(2026, 6, 17, 21, 30).toISOString();
    const other = new Date(2026, 6, 15, 12, 0).toISOString();
    const m = bucketByDay([base, later, other]);
    expect(m.get("2026-07-17")).toBe(2);
    expect(m.get("2026-07-15")).toBe(1);
    expect(m.size).toBe(2);
  });
  it("ignores unparseable entries", () => {
    expect(bucketByDay(["garbage"]).size).toBe(0);
  });
});

describe("streaks", () => {
  const days = (...k: string[]) => new Set(k);
  it("counts a run ending today", () => {
    const s = streaks(days("2026-07-15", "2026-07-16", "2026-07-17"), "2026-07-17");
    expect(s.current).toBe(3);
    expect(s.longest).toBe(3);
  });
  it("a run ending yesterday still counts as current (today is not over)", () => {
    const s = streaks(days("2026-07-15", "2026-07-16"), "2026-07-17");
    expect(s.current).toBe(2);
  });
  it("a gap before yesterday means no current streak", () => {
    const s = streaks(days("2026-07-14"), "2026-07-17");
    expect(s.current).toBe(0);
    expect(s.longest).toBe(1);
  });
  it("longest finds an older, longer run", () => {
    const s = streaks(days("2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-16", "2026-07-17"), "2026-07-17");
    expect(s.current).toBe(2);
    expect(s.longest).toBe(4);
  });
  it("empty set is all zeros", () => {
    expect(streaks(new Set(), "2026-07-17")).toEqual({ current: 0, longest: 0 });
  });
});

describe("daysInLast30", () => {
  it("counts distinct study days in the last 30 including today", () => {
    const set = new Set(["2026-07-17", "2026-07-01", "2026-06-18", "2026-06-17"]);
    // window is 2026-06-18 .. 2026-07-17 inclusive
    expect(daysInLast30(set, "2026-07-17")).toBe(3);
  });
});

describe("heatLevel", () => {
  it("maps visit counts to the four cell levels", () => {
    expect(heatLevel(0)).toBe(0);
    expect(heatLevel(1)).toBe(1);
    expect(heatLevel(2)).toBe(1);
    expect(heatLevel(3)).toBe(2);
    expect(heatLevel(4)).toBe(2);
    expect(heatLevel(5)).toBe(3);
    expect(heatLevel(12)).toBe(3);
  });
});
