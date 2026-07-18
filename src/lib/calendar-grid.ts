// Lays out a year as GitHub-style week columns (Sunday-first), with month
// labels aligned to the first early-month column. Pure; rendering happens
// in the stats page.
import { dayKey, addDays } from "./stats-calc";

type GridCell = { key: string; inYear: boolean; future: boolean };
type YearGrid = { weeks: number; cells: GridCell[]; monthLabels: { col: number; label: string }[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function buildYearGrid(year: number, todayKey: string): YearGrid {
  const jan1 = new Date(year, 0, 1);
  const start = addDays(dayKey(jan1), -jan1.getDay()); // back to Sunday
  const endKey = `${year}-12-31`;

  const cells: GridCell[] = [];
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  let cursor = start;
  let col = 0;
  while (cells.length === 0 || cells[cells.length - 1].key < endKey) {
    for (let row = 0; row < 7; row++) {
      const inYear = cursor.startsWith(String(year));
      cells.push({ key: cursor, inYear, future: cursor > todayKey });
      if (row === 0 && inYear) {
        const m = Number(cursor.slice(5, 7)) - 1;
        const dayOfMonth = Number(cursor.slice(8, 10));
        if (m !== lastMonth && dayOfMonth <= 14) { monthLabels.push({ col, label: MONTHS[m] }); lastMonth = m; }
      }
      cursor = addDays(cursor, 1);
    }
    col++;
  }
  return { weeks: col, cells, monthLabels };
}
