// Lightweight in-memory TTL cache.
// Prevents re-issuing identical Shopee queries in a short window.

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private ttl: number;

  constructor(ttlMs?: number) {
    this.ttl = ttlMs ?? parseInt(process.env.CACHE_TTL_MS ?? '30000', 10);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.ttl });
  }

  key(...parts: (string | number | boolean | undefined)[]): string {
    return parts.map(String).join(':');
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new Cache();
