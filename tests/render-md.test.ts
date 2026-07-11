import { describe, it, expect } from "vitest";
import { renderMarkdown } from "../src/lib/render-md";

describe("renderMarkdown", () => {
  it("escapes HTML so pasted tags can never execute", () => {
    const out = renderMarkdown('<script>alert("x")</script>');
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });
  it("renders # / ## / ### headings as h3", () => {
    expect(renderMarkdown("## Things I forget")).toBe("<h3>Things I forget</h3>");
    expect(renderMarkdown("# Top")).toBe("<h3>Top</h3>");
  });
  it("groups - lines into a list", () => {
    expect(renderMarkdown("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
  });
  it("renders bold, italics and inline code", () => {
    expect(renderMarkdown("**b** and *i* and `c`")).toBe("<p><strong>b</strong> and <em>i</em> and <code>c</code></p>");
  });
  it("splits paragraphs on blank lines, keeps single newlines as breaks", () => {
    expect(renderMarkdown("a\nb\n\nc")).toBe("<p>a<br>b</p><p>c</p>");
  });
  it("returns empty string for empty input", () => {
    expect(renderMarkdown("")).toBe("");
  });
});
