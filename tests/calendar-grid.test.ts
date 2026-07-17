import { describe, it, expect } from "vitest";
import { buildYearGrid } from "../src/lib/calendar-grid";

describe("buildYearGrid", () => {
  const grid = buildYearGrid(2026, "2026-07-17");
  it("starts on the Sunday on/before Jan 1 and covers the whole year", () => {
    expect(grid.cells.length).toBe(grid.weeks * 7);
    expect(grid.cells[0].key <= "2026-01-01").toBe(true);
    expect(grid.cells[grid.cells.length - 1].key >= "2026-12-31").toBe(true);
  });
  it("cells are column-major: 7 consecutive cells share a week", () => {
    // Jan 1 2026 is a Thursday; the first column runs Dec 28 .. Jan 3
    expect(grid.cells[0].key).toBe("2025-12-28");
    expect(grid.cells[4].key).toBe("2026-01-01");
    expect(grid.cells[7].key).toBe("2026-01-04");
  });
  it("flags out-of-year and future days", () => {
    expect(grid.cells[0].inYear).toBe(false);
    expect(grid.cells[4].inYear).toBe(true);
    const future = grid.cells.find((c) => c.key === "2026-12-25")!;
    expect(future.future).toBe(true);
    const past = grid.cells.find((c) => c.key === "2026-07-17")!;
    expect(past.future).toBe(false);
  });
  it("month labels land once per month on early-month columns, in order", () => {
    expect(grid.monthLabels.length).toBe(12);
    expect(grid.monthLabels[0].label).toBe("Jan");
    expect(grid.monthLabels[11].label).toBe("Dec");
    for (let i = 1; i < 12; i++) expect(grid.monthLabels[i].col).toBeGreaterThan(grid.monthLabels[i - 1].col);
  });
});
