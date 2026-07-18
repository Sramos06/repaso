// tests/sync-pull.test.ts
// Pull-side coverage: same in-memory local-db harness as outbox.test.ts, but
// exercising runSync()'s pull() against a stubbed /api/reviewers,
// /api/reviewers/:id, and /api/notes/all. Each case seeds concrete store
// state, runs one sync pass, and asserts the stores afterward.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeMemoryDb } from "./helpers/memory-local-db";

const mem = makeMemoryDb();
vi.mock("../src/lib/local-db", () => mem);
vi.stubGlobal("navigator", { onLine: true });

const { runSync } = await import("../src/lib/sync");

function respond(status: number, body: unknown = {}) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);
}

beforeEach(() => { mem._reset(); vi.restoreAllMocks(); });

describe("sync pull", () => {
  it("a row with a queued patch is not overwritten by a changed server row (locallyAhead)", async () => {
    mem._stores.reviewers.set("r1", {
      id: "r1", title: "Local Title", subject: null, pinned: false, archivedAt: null,
      createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-01T00:00:00.000Z",
      lastOpenedAt: null, sizeBytes: 10, payload: "local-payload", encoding: "gzip",
      hasNotes: false, pending: false,
    });
    // A patch is queued for r1: the server's changed row must not clobber it
    // until the flush confirms and the entry leaves the outbox.
    mem._stores.outbox.set(1, { kind: "patch", id: "r1", patch: { pinned: true }, seq: 1, attempts: 0 });

    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/reviewers/r1" && method === "PATCH") return respond(500); // keep the patch queued through pull
      if (url === "/api/reviewers" && method === "GET") {
        return respond(200, {
          reviewers: [{
            id: "r1", title: "Server Title", subject: null, pinned: true, archivedAt: null,
            createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z",
            lastOpenedAt: null, sizeBytes: 10, hasNotes: false,
          }],
        });
      }
      if (url === "/api/notes/all") return respond(200, { notes: [] });
      return respond(200, {});
    });

    await runSync();

    const row = mem._stores.reviewers.get("r1")!;
    expect(row.title).toBe("Local Title");
    expect(row.pinned).toBe(false);
    expect(row.updatedAt).toBe("2026-07-01T00:00:00.000Z");
  });

  it("a row with a queued delete is neither re-fetched nor its note re-adopted", async () => {
    // localDelete already removed the reviewer and note rows optimistically;
    // only the queued delete mutation remains until the server confirms.
    mem._stores.outbox.set(1, { kind: "delete", id: "r1", seq: 1, attempts: 0 });

    let contentFetchCalls = 0;
    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/reviewers/r1" && method === "DELETE") return respond(500); // keep the delete queued through pull
      if (url === "/api/reviewers/r1" && method === "GET") { contentFetchCalls++; return respond(200, { id: "r1", title: "Server Title", htmlContent: "<html></html>", encoding: "plain" }); }
      if (url === "/api/reviewers" && method === "GET") {
        return respond(200, {
          reviewers: [{
            id: "r1", title: "Server Title", subject: null, pinned: false, archivedAt: null,
            createdAt: "2026-07-01T00:00:00.000Z", updatedAt: "2026-07-18T00:00:00.000Z",
            lastOpenedAt: null, sizeBytes: 10, hasNotes: true,
          }],
        });
      }
      if (url === "/api/notes/all") return respond(200, { notes: [{ reviewerId: "r1", contentMd: "server note", updatedAt: "2026-07-18T00:00:00.000Z" }] });
      return respond(200, {});
    });

    await runSync();

    expect(contentFetchCalls).toBe(0); // locallyDeleted guard: content never re-fetched
    expect(mem._stores.reviewers.get("r1")).toBeUndefined(); // not resurrected
    expect(mem._stores.notes.get("r1")).toBeUndefined(); // its note not re-adopted either
  });

  it("a dirty local note survives pull adoption", async () => {
    mem._stores.notes.set("r1", { key: "r1", contentMd: "unsaved local edit", updatedAt: null, dirty: true });

    vi.stubGlobal("fetch", (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url === "/api/reviewers" && method === "GET") return respond(200, { reviewers: [] });
      if (url === "/api/notes/all") return respond(200, { notes: [{ reviewerId: "r1", contentMd: "server text", updatedAt: "2026-07-18T00:00:00.000Z" }] });
      return respond(200, {});
    });

    await runSync();

    const note = mem._stores.notes.get("r1")!;
    expect(note.contentMd).toBe("unsaved local edit"); // outbox will reconcile this, not pull
    expect(note.dirty).toBe(true);
  });
});
