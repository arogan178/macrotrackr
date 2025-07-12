// src/lib/cache-service.ts

import { loggerHelpers } from "./logger";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    this.cache.set(key, entry);
    loggerHelpers.performance("Cache SET", 0, { key });
  }
}

export const cacheService = new CacheService();
