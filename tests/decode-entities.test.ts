import { describe, it, expect } from "vitest";
import { decodeEntities } from "../src/lib/decode-entities";

describe("decodeEntities", () => {
  it("decodes the common named entities", () => {
    expect(decodeEntities("Modeling &amp; Simulation")).toBe("Modeling & Simulation");
    expect(decodeEntities("a &lt; b &gt; c")).toBe("a < b > c");
    expect(decodeEntities("&quot;quoted&quot; and it&apos;s")).toBe('"quoted" and it\'s');
    expect(decodeEntities("hard&nbsp;space")).toBe("hard space");
  });

  it("decodes decimal and hex numeric entities", () => {
    expect(decodeEntities("&#65;&#66;&#67;")).toBe("ABC");
    expect(decodeEntities("caf&#233;")).toBe("café");
    expect(decodeEntities("&#x41;&#x42;")).toBe("AB");
    expect(decodeEntities("&#x1F4D8;")).toBe("\u{1F4D8}"); // 📘, above the BMP
  });

  it("decodes each entity exactly once (no cascading)", () => {
    // &amp;lt; is the escaped form of the literal text "&lt;" — it must not
    // decode all the way to "<".
    expect(decodeEntities("&amp;lt;")).toBe("&lt;");
  });

  it("leaves unknown or malformed entities untouched", () => {
    expect(decodeEntities("keep &copy; and &notreal;")).toBe("keep &copy; and &notreal;");
    expect(decodeEntities("bare & ampersand")).toBe("bare & ampersand");
    expect(decodeEntities("&#x110000;")).toBe("&#x110000;"); // past the Unicode ceiling
  });

  it("returns plain text unchanged", () => {
    expect(decodeEntities("STAT 023 Reviewer")).toBe("STAT 023 Reviewer");
  });
});
