import { describe, it, expect } from "vitest";
import { stripHtml } from "../src/lib/strip-html";

describe("stripHtml", () => {
  it("removes tags and keeps text", () => {
    expect(stripHtml("<h1>Hypothesis</h1><p>reject H0</p>")).toBe("Hypothesis reject H0");
  });
  it("drops script and style contents entirely", () => {
    expect(stripHtml("<style>.a{color:red}</style>Keep<script>alert(1)</script>me")).toBe("Keep me");
  });
  it("decodes common entities", () => {
    expect(stripHtml("p &lt; &alpha; &amp; q &gt; 0")).toBe("p < &alpha; & q > 0");
  });
  it("collapses whitespace and trims", () => {
    expect(stripHtml("  a\n\n   b\t c  ")).toBe("a b c");
  });
  it("returns empty for empty input", () => {
    expect(stripHtml("")).toBe("");
  });
});
