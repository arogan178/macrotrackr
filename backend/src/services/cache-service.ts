import { loggerHelpers } from "../lib/observability/logger";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T) {
    this.cache.set(key, { data, timestamp: Date.now() });
    loggerHelpers.performance("Cache SET", 0, { key });
  }

  clear() {
    this.cache.clear();
  }
}

export const createCacheService = () => new CacheService();
