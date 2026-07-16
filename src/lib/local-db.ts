// src/lib/local-db.ts
// Thin promise wrapper around IndexedDB plus the cross-tab change channel.
// GLUE ONLY: every decision belongs in sync-plan.ts where it is testable.
"use client";

const DB_NAME = "repaso-local";
const DB_VERSION = 1;
export type StoreName = "reviewers" | "notes" | "outbox" | "meta";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null); // SSR / very old browser
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("reviewers")) db.createObjectStore("reviewers", { keyPath: "id" });
      if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "key" });
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "seq", autoIncrement: true });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null); // storage denied: app still works online-only
  });
  return dbPromise;
}

// Lets the UI say plainly when this browser cannot store Repaso's data.
export function localStoreAvailable(): Promise<boolean> {
  return openDb().then((db) => db !== null);
}

function request<T>(store: StoreName, mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest): Promise<T | undefined> {
  return openDb().then((db) => {
    if (!db) return undefined;
    return new Promise<T | undefined>((resolve) => {
      const r = run(db.transaction(store, mode).objectStore(store));
      r.onsuccess = () => resolve(r.result as T);
      r.onerror = () => resolve(undefined);
    });
  });
}

export const dbGet = <T>(store: StoreName, key: IDBValidKey) => request<T>(store, "readonly", (s) => s.get(key));
export const dbPut = (store: StoreName, value: unknown) => request<IDBValidKey>(store, "readwrite", (s) => s.put(value));
export const dbAdd = (store: StoreName, value: unknown) => request<IDBValidKey>(store, "readwrite", (s) => s.add(value));
export const dbDel = (store: StoreName, key: IDBValidKey) => request<undefined>(store, "readwrite", (s) => s.delete(key));
export const dbGetAll = <T>(store: StoreName) => request<T[]>(store, "readonly", (s) => s.getAll()).then((r) => r ?? []);
export const dbClear = (store: StoreName) => request<undefined>(store, "readwrite", (s) => s.clear());

// ---- cross-tab + same-tab change notifications ----
export type LocalMsg = { type: "changed" } | { type: "note-merged"; target: string };

const listeners = new Set<(msg: LocalMsg) => void>();
let channel: BroadcastChannel | null = null;
function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) {
    channel = new BroadcastChannel("repaso-local");
    channel.onmessage = (e) => listeners.forEach((cb) => cb(e.data as LocalMsg));
  }
  return channel;
}

export function notifyChange(msg: LocalMsg = { type: "changed" }): void {
  listeners.forEach((cb) => cb(msg)); // same tab, immediately
  getChannel()?.postMessage(msg); // other tabs
}

export function onLocalChange(cb: (msg: LocalMsg) => void): () => void {
  getChannel(); // ensure the channel listens even if we only subscribe
  listeners.add(cb);
  return () => listeners.delete(cb);
}
