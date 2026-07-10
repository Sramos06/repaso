import { describe, it, expect } from "vitest";
import { resolveNoteTarget } from "../src/lib/note-target";

describe("resolveNoteTarget", () => {
  it("maps 'scratchpad' and null to the global note", () => {
    expect(resolveNoteTarget("scratchpad")).toEqual({ reviewerId: null });
    expect(resolveNoteTarget(null)).toEqual({ reviewerId: null });
  });
  it("passes through a UUID", () => {
    const id = "7b52009b-5b3a-4b52-9d5c-1a2b3c4d5e6f";
    expect(resolveNoteTarget(id)).toEqual({ reviewerId: id });
  });
  it("rejects anything else", () => {
    expect(resolveNoteTarget("1 OR 1=1")).toEqual({ error: "Invalid reviewer id." });
  });
});
