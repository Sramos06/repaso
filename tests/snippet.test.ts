import { describe, it, expect } from "vitest";
import { makeSnippet } from "../src/lib/snippet";

describe("makeSnippet", () => {
  it("windows around a mid-string match with ellipses on both sides", () => {
    const text = "a".repeat(100) + " chi-square " + "b".repeat(100);
    const s = makeSnippet(text, "chi-square", 10);
    expect(s.startsWith("…")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
    expect(s.toLowerCase()).toContain("chi-square");
  });
  it("omits the leading ellipsis when the match is at the start", () => {
    const s = makeSnippet("reject H0 when p is small and blah blah blah blah", "reject", 8);
    expect(s.startsWith("…")).toBe(false);
    expect(s.toLowerCase()).toContain("reject");
  });
  it("is case-insensitive", () => {
    expect(makeSnippet("The Central Limit Theorem", "central", 100).toLowerCase()).toContain("central");
  });
  it("falls back to the head of the text when the term is absent", () => {
    expect(makeSnippet("hello world", "zzz", 100)).toBe("hello world");
  });
  it("returns empty string for empty text", () => {
    expect(makeSnippet("", "x")).toBe("");
  });
});
