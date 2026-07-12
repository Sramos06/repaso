import { describe, it, expect } from "vitest";
import { newShareToken, isShareToken } from "../src/lib/share-token";

describe("share tokens", () => {
  it("newShareToken produces a 32-char base64url string", () => {
    const t = newShareToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(isShareToken(t)).toBe(true);
  });
  it("newShareToken is unpredictable (100 distinct)", () => {
    const set = new Set(Array.from({ length: 100 }, () => newShareToken()));
    expect(set.size).toBe(100);
  });
  it("isShareToken rejects wrong length, bad chars, empty", () => {
    expect(isShareToken("")).toBe(false);
    expect(isShareToken("short")).toBe(false);
    expect(isShareToken("x".repeat(40))).toBe(false);
    expect(isShareToken("a".repeat(31) + "+")).toBe(false); // '+' is not base64url
  });
});
