import { describe, it, expect } from "vitest";
import { copyTitle } from "../src/lib/copy-title";

describe("copyTitle", () => {
  it("appends the copy suffix", () => {
    expect(copyTitle("STAT 023 Reviewer")).toBe("STAT 023 Reviewer (copy)");
  });
  it("keeps the result within the 200-char title cap", () => {
    const long = "x".repeat(200);
    const out = copyTitle(long);
    expect(out.length).toBe(200);
    expect(out.endsWith(" (copy)")).toBe(true);
  });
  it("handles an empty title", () => {
    expect(copyTitle("")).toBe(" (copy)");
  });
});
