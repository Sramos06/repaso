// tests/helpers/memory-local-db.ts
// In-memory stand-in for src/lib/local-db, letting vitest exercise the
// outbox and pull orchestration that IndexedDB normally hides from tests.
type Store = Map<unknown, Record<string, unknown>>;

export function makeMemoryDb() {
  const stores: Record<string, Store> = { reviewers: new Map(), notes: new Map(), outbox: new Map(), meta: new Map() };
  let seq = 0;
  const messages: unknown[] = [];
  const keyOf: Record<string, string> = { reviewers: "id", notes: "key", outbox: "seq", meta: "key" };
  return {
    _stores: stores,
    _messages: messages,
    _reset() { for (const s of Object.values(stores)) s.clear(); seq = 0; messages.length = 0; },
    async dbGet(store: string, key: unknown) { return stores[store].get(key); },
    async dbPut(store: string, value: Record<string, unknown>) { stores[store].set(value[keyOf[store]], value); return value[keyOf[store]]; },
    async dbAdd(store: string, value: Record<string, unknown>) { const k = ++seq; stores[store].set(k, { ...value, seq: k }); return k; },
    async dbDel(store: string, key: unknown) { stores[store].delete(key); },
    async dbGetAll(store: string) { return [...stores[store].values()]; },
    async dbClear(store: string) { stores[store].clear(); },
    notifyChange(msg: unknown = { type: "changed" }) { messages.push(msg); },
    onLocalChange() { return () => {}; },
    async localStoreAvailable() { return true; },
  };
}
