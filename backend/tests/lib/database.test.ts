import type { Database } from "bun:sqlite";
import { describe, expect, it, vi } from "vitest";

// Mock the logger module
vi.mock("../../src/lib/logger", () => ({
  loggerHelpers: {
    error: vi.fn(),
    dbQuery: vi.fn(),
  },
}));

// Mock the query-tracer
vi.mock("../../src/lib/query-tracer", () => ({
  traceQuerySync: vi.fn((_query: string, _params: unknown[], fn: () => unknown) => fn()),
}));

import { DatabaseError } from "../../src/lib/errors";
import {
  safeExecute,
  safeQuery,
  safeQueryAll,
  withTransaction,
} from "../../src/lib/database";

describe("database utilities", () => {
  // Create mock database with proper typing
  const createMockDb = () => {
    const mockGet = vi.fn().mockReturnValue({ id: 1, name: "test" });
    const mockAll = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
    const mockRun = vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 42 });
    
    const mockStatement = {
      get: mockGet,
      all: mockAll,
      run: mockRun,
    };
    
    return {
      prepare: vi.fn(() => mockStatement),
      // transaction(operation) returns a function that wraps the operation
      transaction: vi.fn((operation: () => unknown) => {
        return () => operation();
      }),
    } as unknown as Database;
  };

  describe("withTransaction", () => {
    it("executes operation within transaction", () => {
      const mockDb = createMockDb();
      const operation = vi.fn(() => "result");

      const result = withTransaction(mockDb, operation);

      expect(result).toBe("result");
      expect(mockDb.transaction).toHaveBeenCalledWith(operation);
    });

    it("throws DatabaseError on operation failure", () => {
      const mockDb = createMockDb();
      // Make the returned transaction function throw
      mockDb.transaction = vi.fn((_operation: () => unknown) => {
        return () => {
          throw new Error("Operation failed");
        };
      }) as never;

      expect(() => withTransaction(mockDb, vi.fn())).toThrow(DatabaseError);
    });
  });

  describe("safeQuery", () => {
    it("returns result on successful query", () => {
      const mockDb = createMockDb();
      const mockResult = { id: 1, name: "test" };
      
      const result = safeQuery(mockDb, "SELECT * FROM users WHERE id = ?", [1]);

      expect(result).toEqual(mockResult);
    });

    it("throws DatabaseError on query failure", () => {
      const mockDb = createMockDb();
      mockDb.prepare = vi.fn(() => {
        throw new Error("Query failed");
      }) as never;

      expect(() =>
        safeQuery(mockDb, "INVALID QUERY", [])
      ).toThrow(DatabaseError);
    });
  });

  describe("safeQueryAll", () => {
    it("returns array of results", () => {
      const mockDb = createMockDb();
      const mockResults = [{ id: 1 }, { id: 2 }];

      const result = safeQueryAll(mockDb, "SELECT * FROM users", []);

      expect(result).toEqual(mockResults);
    });

    it("throws DatabaseError on query failure", () => {
      const mockDb = createMockDb();
      mockDb.prepare = vi.fn(() => {
        throw new Error("Query failed");
      }) as never;

      expect(() =>
        safeQueryAll(mockDb, "INVALID QUERY", [])
      ).toThrow(DatabaseError);
    });
  });

  describe("safeExecute", () => {
    it("returns changes and lastInsertRowid on success", () => {
      const mockDb = createMockDb();
      const mockResult = { changes: 1, lastInsertRowid: 42 };

      const result = safeExecute(
        mockDb,
        "INSERT INTO users (name) VALUES (?)",
        ["test"]
      );

      expect(result).toEqual(mockResult);
    });

    it("throws DatabaseError on execution failure", () => {
      const mockDb = createMockDb();
      mockDb.prepare = vi.fn(() => {
        throw new Error("Execution failed");
      }) as never;

      expect(() =>
        safeExecute(mockDb, "INVALID STATEMENT", [])
      ).toThrow(DatabaseError);
    });
  });
});
