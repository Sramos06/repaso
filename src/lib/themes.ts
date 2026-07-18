// The theme catalog is the single source of truth shared by the picker UI,
// the root layout (which stamps data-theme), and the save endpoint (which
// validates). A theme is only a set of CSS custom properties — see globals.css.
export type Theme = "warm" | "night" | "coffee" | "matcha";

export const DEFAULT_THEME: Theme = "warm";

export type ThemePreview = {
  paper: string; // chip background
  ink: string; // chip text color
  accent: string; // selection stamp color
  washi: string; // tape strip color
};

export type ThemeMeta = {
  id: Theme;
  label: string;
  preview: ThemePreview; // real palette snapshot for the picker chip
  note: string; // one-line description
};

export const THEMES: ThemeMeta[] = [
  {
    id: "warm",
    label: "Warm Paper",
    preview: { paper: "#F7EFE2", ink: "#2B2118", accent: "#C4552D", washi: "rgba(217,164,65,.55)" },
    note: "Cream & terracotta",
  },
  {
    id: "night",
    label: "Night Library",
    preview: { paper: "#17130F", ink: "#EFE5D4", accent: "#E4854B", washi: "rgba(148,168,131,.30)" },
    note: "Espresso & warm lamp",
  },
  {
    id: "coffee",
    label: "Coffee",
    preview: { paper: "#ECE0CE", ink: "#3A2A1D", accent: "#A25C2C", washi: "rgba(201,154,75,.50)" },
    note: "Latte & caramel",
  },
  {
    id: "matcha",
    label: "Matcha",
    preview: { paper: "#EFF0E0", ink: "#2B342A", accent: "#6E9457", washi: "rgba(122,139,111,.45)" },
    note: "Rice paper & tea",
  },
];

const IDS = new Set<string>(THEMES.map((t) => t.id));

export function isTheme(x: unknown): x is Theme {
  return typeof x === "string" && IDS.has(x);
}

export function coerceTheme(x: unknown): Theme {
  return isTheme(x) ? x : DEFAULT_THEME;
}
