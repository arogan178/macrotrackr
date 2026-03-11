import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the logger module
vi.mock("../../src/lib/logger", () => ({
  loggerHelpers: {
    performance: vi.fn(),
    security: vi.fn(),
  },
}));

import { cacheService } from "../../src/lib/cache-service";

describe("cacheService", () => {
  beforeEach(() => {
    // Clear the cache before each test by accessing the private cache
    const cache = (cacheService as any).cache;
    cache.clear();
  });

  it("returns null for non-existent key", () => {
    const result = cacheService.get("nonexistent");
    expect(result).toBeNull();
  });

  it("stores and retrieves data", () => {
    const testData = { id: 1, name: "test" };
    cacheService.set("key1", testData);
    
    const result = cacheService.get("key1");
    expect(result).toEqual(testData);
  });

  it("returns null for expired cache entry", () => {
    const testData = { id: 1, name: "test" };
    cacheService.set("key1", testData);
    
    // Manually expire the cache by manipulating the internal cache
    const cache = (cacheService as any).cache;
    const entry = cache.get("key1");
    entry.timestamp = Date.now() - 3600001; // More than 1 hour ago
    
    const result = cacheService.get("key1");
    expect(result).toBeNull();
  });

  it("deletes expired entries", () => {
    const testData = { id: 1, name: "test" };
    cacheService.set("key1", testData);
    
    // Manually expire
    const cache = (cacheService as any).cache;
    const entry = cache.get("key1");
    entry.timestamp = Date.now() - 3600001;
    
    cacheService.get("key1");
    
    // Entry should be deleted
    expect(cache.get("key1")).toBeUndefined();
  });

  it("can store different types of data", () => {
    cacheService.set("string", "test string");
    cacheService.set("number", 42);
    cacheService.set("boolean", true);
    cacheService.set("array", [1, 2, 3]);
    cacheService.set("object", { nested: { value: true } });

    expect(cacheService.get("string")).toBe("test string");
    expect(cacheService.get("number")).toBe(42);
    expect(cacheService.get("boolean")).toBe(true);
    expect(cacheService.get("array")).toEqual([1, 2, 3]);
    expect(cacheService.get("object")).toEqual({ nested: { value: true } });
  });
});
