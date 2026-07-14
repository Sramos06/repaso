import { describe, it, expect } from "vitest";
import { formatBytes } from "../src/lib/format-bytes";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
  });
  it("formats kilobytes (whole numbers)", () => {
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(760 * 1024)).toBe("760 KB");
  });
  it("formats megabytes with one decimal", () => {
    expect(formatBytes(1.4 * 1024 * 1024)).toBe("1.4 MB");
  });
  it("formats gigabytes with two decimals", () => {
    expect(formatBytes(1.2 * 1024 * 1024 * 1024)).toBe("1.20 GB");
  });
  it("treats junk as zero", () => {
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
  });
});
