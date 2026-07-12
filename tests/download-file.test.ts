import { describe, it, expect } from "vitest";
import { htmlFilename } from "../src/lib/download-file";

describe("htmlFilename", () => {
  it("appends .html", () => {
    expect(htmlFilename("Stats Final")).toBe("Stats Final.html");
  });
  it("strips characters illegal in filenames", () => {
    expect(htmlFilename('a/b:c*?"<>|d')).toBe("abcd.html");
  });
  it("falls back to 'reviewer' when nothing usable remains", () => {
    expect(htmlFilename("///")).toBe("reviewer.html");
    expect(htmlFilename("   ")).toBe("reviewer.html");
  });
  it("truncates very long titles", () => {
    expect(htmlFilename("x".repeat(300)).length).toBeLessThanOrEqual(105);
  });
});
