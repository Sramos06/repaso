// Pure stats math over open-event timestamps. All day logic is LOCAL time:
// a study day is a day on Shawn's clock, not UTC's.

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export function bucketByDay(isoEvents: string[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const iso of isoEvents) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) continue;
    const k = dayKey(new Date(t));
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

// Current streak may end today OR yesterday (today is not over yet).
export function streaks(days: Set<string>, todayKey: string): { current: number; longest: number } {
  let current = 0;
  let cursor = days.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (days.has(cursor)) { current++; cursor = addDays(cursor, -1); }

  let longest = 0;
  for (const k of days) {
    if (days.has(addDays(k, -1))) continue; // not a run start
    let len = 0; let c = k;
    while (days.has(c)) { len++; c = addDays(c, 1); }
    if (len > longest) longest = len;
  }
  return { current, longest };
}

export function daysInLast30(days: Set<string>, todayKey: string): number {
  let n = 0;
  for (let i = 0; i < 30; i++) if (days.has(addDays(todayKey, -i))) n++;
  return n;
}

// 0 none · 1 light (1-2) · 2 medium (3-4) · 3 deep (5+)
export function heatLevel(visits: number): 0 | 1 | 2 | 3 {
  if (visits >= 5) return 3;
  if (visits >= 3) return 2;
  if (visits >= 1) return 1;
  return 0;
}
