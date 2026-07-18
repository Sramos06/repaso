// tests/outbox.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMemoryDb } from "./helpers/memory-local-db";

const mem = makeMemoryDb();
vi.mock("../src/lib/local-db", () => mem);
vi.stubGlobal("navigator", { onLine: true });

const { enqueue, flushOutbox } = await import("../src/lib/outbox");

function respond(status: number, body: unknown = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
}

beforeEach(() => { mem._reset(); vi.restoreAllMocks(); });

describe("outbox flush", () => {
  it("sends in seq order and deletes confirmed entries", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => { calls.push(`${init?.method ?? "GET"} ${url}`); return respond(200, { ok: true, updatedAt: "2026-07-17T00:00:00.000Z" }); });
    await enqueue({ kind: "patch", id: "r1", patch: { pinned: true } });
    await enqueue({ kind: "note", target: "r1", contentMd: "x", baseUpdatedAt: null });
    await flushOutbox();
    expect(calls[0]).toContain("PATCH");
    expect(calls[1]).toContain("PUT");
    expect(mem._stores.outbox.size).toBe(0);
  });

  it("drops on 404 (permanent verdict) but retries on 500", async () => {
    vi.stubGlobal("fetch", () => respond(404));
    await enqueue({ kind: "note", target: "gone", contentMd: "x", baseUpdatedAt: null });
    await flushOutbox();
    expect(mem._stores.outbox.size).toBe(0); // dropped, queue not poisoned

    vi.stubGlobal("fetch", () => respond(500));
    await enqueue({ kind: "note", target: "r1", contentMd: "y", baseUpdatedAt: null });
    await flushOutbox();
    const left = [...mem._stores.outbox.values()];
    expect(left.length).toBe(1);
    expect(left[0].attempts).toBe(1); // kept for backoff retry
  });

  it("keep-both on a real conflict, quiet adoption on identical text", async () => {
    mem._stores.notes.set("r1", { key: "r1", contentMd: "mine", updatedAt: null, dirty: true });
    // First PUT conflicts; the requeued merged save (fresh base) then succeeds,
    // exactly like the real server would. An always-409 stub would loop forever.
    let puts = 0;
    vi.stubGlobal("fetch", () => {
      puts++;
      return puts === 1
        ? respond(409, { contentMd: "theirs", updatedAt: "2026-07-17T00:00:00.000Z" })
        : respond(200, { ok: true, updatedAt: "2026-07-17T00:01:00.000Z" });
    });
    await enqueue({ kind: "note", target: "r1", contentMd: "mine", baseUpdatedAt: null });
    await flushOutbox();
    const note = mem._stores.notes.get("r1")!;
    expect(String(note.contentMd)).toContain("theirs");
    expect(String(note.contentMd)).toContain("mine");
    expect(mem._messages.some((m) => (m as { type?: string }).type === "note-merged")).toBe(true);

    mem._reset();
    mem._stores.notes.set("r2", { key: "r2", contentMd: "same", updatedAt: null, dirty: true });
    vi.stubGlobal("fetch", () => respond(409, { contentMd: "same", updatedAt: "2026-07-17T01:00:00.000Z" }));
    await enqueue({ kind: "note", target: "r2", contentMd: "same", baseUpdatedAt: null });
    await flushOutbox();
    const quiet = mem._stores.notes.get("r2")!;
    expect(quiet.dirty).toBe(false); // adopted as confirmation
    expect(mem._messages.some((m) => (m as { type?: string }).type === "note-merged")).toBe(false);
    expect(mem._stores.outbox.size).toBe(0);
  });

  it("upload adoption remaps queued mutations to the real id", async () => {
    mem._stores.reviewers.set("local-1", { id: "local-1", pending: true, title: "T" });
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      if (init?.method === "POST" && url === "/api/reviewers") return respond(201, { created: [{ id: "real-9", title: "T" }], rejected: [] });
      return respond(200, { ok: true });
    });
    await enqueue({ kind: "upload", tempId: "local-1", name: "t.html", payload: "p", encoding: "gzip" });
    await enqueue({ kind: "patch", id: "local-1", patch: { pinned: true } });
    await flushOutbox();
    expect(mem._stores.reviewers.get("real-9")).toBeTruthy();
    expect(mem._stores.reviewers.get("local-1")).toBeUndefined();
    expect(mem._stores.meta.get("remap:local-1")).toMatchObject({ value: "real-9" });
    expect(mem._stores.outbox.size).toBe(0); // the patch flushed too, against real-9
  });

  it("note enqueue collapses to one pending entry per target", async () => {
    vi.stubGlobal("fetch", () => respond(500)); // keep everything queued
    await enqueue({ kind: "note", target: "r1", contentMd: "a", baseUpdatedAt: null });
    await enqueue({ kind: "note", target: "r1", contentMd: "ab", baseUpdatedAt: null });
    const notes = [...mem._stores.outbox.values()].filter((m) => m.kind === "note");
    expect(notes.length).toBe(1);
    expect(notes[0].contentMd).toBe("ab");
  });
});
