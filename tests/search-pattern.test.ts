import { describe, it, expect } from "vitest";
import { escapeLike } from "../src/lib/search-pattern";

describe("escapeLike", () => {
  it("escapes LIKE wildcards and the escape char", () => {
    expect(escapeLike("100%")).toBe("100\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });
  it("leaves ordinary text untouched", () => {
    expect(escapeLike("chi-square")).toBe("chi-square");
  });
});
