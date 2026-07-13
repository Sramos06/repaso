// The theme catalog is the single source of truth shared by the picker UI,
// the root layout (which stamps data-theme), and the save endpoint (which
// validates). A theme is only a set of CSS custom properties — see globals.css.
export type Theme = "warm" | "night" | "coffee" | "matcha";

export const DEFAULT_THEME: Theme = "warm";

export type ThemeMeta = {
  id: Theme;
  label: string;
  swatch: string; // representative color for the picker chip
  note: string; // one-line description
};

export const THEMES: ThemeMeta[] = [
  { id: "warm", label: "Warm Paper", swatch: "#C4552D", note: "Cream & terracotta" },
  { id: "night", label: "Night Library", swatch: "#241C15", note: "Espresso & warm lamp" },
  { id: "coffee", label: "Coffee", swatch: "#A25C2C", note: "Latte & caramel" },
  { id: "matcha", label: "Matcha", swatch: "#6E9457", note: "Rice paper & tea" },
];

const IDS = new Set<string>(THEMES.map((t) => t.id));

export function isTheme(x: unknown): x is Theme {
  return typeof x === "string" && IDS.has(x);
}

export function coerceTheme(x: unknown): Theme {
  return isTheme(x) ? x : DEFAULT_THEME;
}
