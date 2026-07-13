import { describe, it, expect } from "vitest";
import { THEMES, DEFAULT_THEME, isTheme, coerceTheme } from "../src/lib/themes";

describe("theme catalog", () => {
  it("has exactly the four known themes in order", () => {
    expect(THEMES.map((t) => t.id)).toEqual(["warm", "night", "coffee", "matcha"]);
  });
  it("defaults to warm", () => {
    expect(DEFAULT_THEME).toBe("warm");
  });
});

describe("isTheme", () => {
  it("accepts the four ids", () => {
    for (const id of ["warm", "night", "coffee", "matcha"]) expect(isTheme(id)).toBe(true);
  });
  it("rejects anything else", () => {
    for (const junk of ["", "dark", "WARM", null, undefined, 3, {}]) expect(isTheme(junk)).toBe(false);
  });
});

describe("coerceTheme", () => {
  it("passes valid ids through", () => {
    expect(coerceTheme("night")).toBe("night");
  });
  it("falls back to the default for junk", () => {
    expect(coerceTheme("dark")).toBe("warm");
    expect(coerceTheme(null)).toBe("warm");
    expect(coerceTheme(undefined)).toBe("warm");
  });
});
