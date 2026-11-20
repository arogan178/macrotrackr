import { loggerHelpers } from "../lib/observability/logger";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_ENTRIES = 2000;

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = MAX_CACHE_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    // Refresh insertion order for LRU eviction.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set<T>(key: string, data: T) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const now = Date.now();
      for (const [entryKey, entry] of this.cache) {
        if (now - entry.timestamp > CACHE_TTL) {
          this.cache.delete(entryKey);
        }
      }
      while (this.cache.size >= this.maxEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey === undefined) break;
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now() });
    loggerHelpers.performance("Cache SET", 0, { key });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

export const createCacheService = () => new CacheService();
