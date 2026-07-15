import { describe, it, expect } from "vitest";
import { pasteTitle } from "../src/lib/paste-title";

describe("pasteTitle", () => {
  it("uses the <title> tag", () => {
    expect(pasteTitle("<html><title>STAT Reviewer</title></html>")).toBe("STAT Reviewer");
  });
  it("handles attributes and whitespace", () => {
    expect(pasteTitle('<title data-x="1">\n  Trimmed  \n</title>')).toBe("Trimmed");
  });
  it("falls back to the first h1, stripping inner tags", () => {
    expect(pasteTitle("<h1>Big <em>Physics</em> Review</h1>")).toBe("Big Physics Review");
  });
  it("prefers title over h1", () => {
    expect(pasteTitle("<title>T</title><h1>H</h1>")).toBe("T");
  });
  it("skips a whitespace-only title and uses the h1", () => {
    expect(pasteTitle("<title>   </title><h1>H</h1>")).toBe("H");
  });
  it("defaults when neither exists", () => {
    expect(pasteTitle("<p>hello</p>")).toBe("Pasted reviewer");
  });
  it("caps at 200 chars", () => {
    expect(pasteTitle(`<title>${"x".repeat(300)}</title>`).length).toBe(200);
  });
});
