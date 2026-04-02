import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockDatabaseInstance = {
  exec: ReturnType<typeof vi.fn>;
  path: string;
  options: { create: boolean };
};

const databaseInstances: MockDatabaseInstance[] = [];
const initializeSchema = vi.fn();

const DatabaseMock = vi.fn((path: string, options: { create: boolean }) => {
  const instance: MockDatabaseInstance = {
    exec: vi.fn(),
    path,
    options,
  };
  databaseInstances.push(instance);
  return instance;
});

async function loadDbModule(configOverrides?: {
  DATABASE_PATH?: string;
  NODE_ENV?: "development" | "production" | "test";
}) {
  vi.resetModules();
  databaseInstances.length = 0;
  initializeSchema.mockReset();

  vi.doMock("bun:sqlite", () => ({
    Database: DatabaseMock,
  }));

  vi.doMock("../../src/config", () => ({
    config: {
      DATABASE_PATH: configOverrides?.DATABASE_PATH ?? "/tmp/macro-tracker.sqlite",
      NODE_ENV: configOverrides?.NODE_ENV ?? "test",
    },
    getConfig: () => ({
      DATABASE_PATH: configOverrides?.DATABASE_PATH ?? "/tmp/macro-tracker.sqlite",
      NODE_ENV: configOverrides?.NODE_ENV ?? "test",
    }),
  }));

  vi.doMock("../../src/db/schema", () => ({
    initializeSchema,
  }));

  return import("../../src/db/index");
}

describe("db/index", () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  beforeEach(() => {
    DatabaseMock.mockClear();
    consoleLogSpy.mockClear();
  });

  afterEach(() => {
    vi.doUnmock("bun:sqlite");
    vi.doUnmock("../../src/config");
    vi.doUnmock("../../src/db/schema");
  });

  it("creates databases with WAL enabled", async () => {
    const dbModule = await loadDbModule();

    const created = dbModule.createDatabase("/tmp/custom.sqlite");

    expect(DatabaseMock).toHaveBeenCalledWith("/tmp/custom.sqlite", {
      create: true,
    });
    expect(created.exec).toHaveBeenCalledWith("PRAGMA journal_mode = WAL;");
  });

  it("initializes schema and logs outside test mode", async () => {
    const dbModule = await loadDbModule({
      DATABASE_PATH: "/tmp/production.sqlite",
      NODE_ENV: "development",
    });
    initializeSchema.mockClear();
    consoleLogSpy.mockClear();

    const database = { exec: vi.fn() };
    const result = dbModule.initializeDatabase(database as never);

    expect(result).toBe(database);
    expect(initializeSchema).toHaveBeenCalledWith(database);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Database connected at /tmp/production.sqlite",
    );
  });

  it("composes create and initialize helpers", async () => {
    const dbModule = await loadDbModule();
    DatabaseMock.mockClear();
    initializeSchema.mockClear();

    const created = dbModule.createInitializedDatabase("/tmp/composed.sqlite");

    expect(DatabaseMock).toHaveBeenCalledWith("/tmp/composed.sqlite", {
      create: true,
    });
    expect(initializeSchema).toHaveBeenCalledWith(created);
  });

  it("does not initialize a database at import time", async () => {
    await loadDbModule({
      DATABASE_PATH: "/tmp/default.sqlite",
      NODE_ENV: "test",
    });

    expect(DatabaseMock).not.toHaveBeenCalled();
    expect(initializeSchema).not.toHaveBeenCalled();
  });
});
