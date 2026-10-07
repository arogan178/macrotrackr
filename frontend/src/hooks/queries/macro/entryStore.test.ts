import { LocalStorageAdapter } from "@tanstack/offline-transactions";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/core";
import { macrosApi } from "@/api/macros";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";

import {
  clearSignedOutAccount,
  closeEntryStore,
  countUnsentEntries,
  getEntryStore,
} from "./entryStore";

vi.mock("@/lib/queryClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/queryClient")>();

  return { ...actual, queryCachePersister: { removeClient: vi.fn() } };
});

vi.mock("@/api/macros", () => ({
  macrosApi: {
    getAllHistory: vi.fn(),
    addEntry: vi.fn(),
    replaceEntry: vi.fn(),
    deleteEntry: vi.fn(),
  },
}));

// jsdom has no IndexedDB; the outbox behaves the same on localStorage.
vi.mock("@tanstack/offline-transactions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/offline-transactions")>();

  return { ...actual, IndexedDBAdapter: actual.LocalStorageAdapter };
});

const lunch = {
  protein: 30,
  carbs: 40,
  fats: 10,
  mealType: "lunch" as const,
  mealName: "Rice bowl",
  entryDate: "2026-10-01",
  entryTime: "12:30",
};

function savedFrom(entry: MacroEntry, id: number): MacroEntry {
  return { ...entry, id, createdAt: "2026-10-01 12:31:00" };
}

const sentNames = () =>
  vi.mocked(macrosApi.addEntry).mock.calls.map(([entry]) => entry.mealName);

// One tab, so it always gets the lock that makes it the queue's only sender.
Object.defineProperty(navigator, "locks", {
  configurable: true,
  value: {
    request: (_name: string, _options: object, callback: (lock: object) => unknown) =>
      Promise.resolve(callback({})),
  },
});

describe("entry store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({ entries: [] });
  });

  afterEach(() => {
    closeEntryStore();
    queryClient.clear();
    vi.resetAllMocks();
  });

  const outboxKeys = (userId: number) =>
    new LocalStorageAdapter(`macrotrackr-outbox-${userId}`).keys();

  it("holds queued entries through an expired session and sends them in order after sign-in", async () => {
    let nextId = 1;
    vi.mocked(macrosApi.addEntry)
      .mockRejectedValueOnce(new ApiError("Unauthorized", 401, "HTTP_401"))
      .mockImplementation(async (entry) => savedFrom(entry as MacroEntry, nextId++));
    const store = getEntryStore(1);
    await store.entries.preload();

    await store.log({ ...lunch, mealName: "First" });
    await store.log({ ...lunch, mealName: "Second" });

    await vi.waitFor(() => expect(sentNames()).toEqual(["First"]));
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(sentNames()).toEqual(["First"]);
    expect(store.entries.toArray.map((entry) => entry.mealName).sort()).toEqual(["First", "Second"]);

    store.resumeAfterSignIn();

    await vi.waitFor(() => expect(sentNames()).toEqual(["First", "First", "Second"]));
    await vi.waitFor(() =>
      expect(store.entries.toArray.map((entry) => [entry.mealName, entry.id]).sort()).toEqual([
        ["First", 1],
        ["Second", 2],
      ]),
    );
  });

  it("still takes entries when the first load of recent entries fails", async () => {
    vi.mocked(macrosApi.getAllHistory).mockRejectedValue(
      new ApiError("Too many API requests", 429, "HTTP_429"),
    );
    vi.mocked(macrosApi.addEntry).mockReturnValue(new Promise(() => {}));
    const store = getEntryStore(1);
    await store.entries.preload();

    await store.log({ ...lunch, mealName: "Logged anyway" });

    expect(store.entries.status).toBe("ready");
    expect(store.entries.toArray.map((entry) => entry.mealName)).toEqual(["Logged anyway"]);
  });

  it("removes an entry the server turns down, and says so", async () => {
    const showNotification = vi.spyOn(useStore.getState(), "showNotification");
    vi.mocked(macrosApi.addEntry).mockRejectedValue(
      new ApiError("Invalid date format", 422, "VALIDATION_ERROR"),
    );
    const store = getEntryStore(1);
    await store.entries.preload();

    await store.log(lunch);

    await vi.waitFor(() => expect(store.entries.toArray).toEqual([]));
    expect(showNotification).toHaveBeenCalledWith(
      "The server turned down an entry, so it was removed. Try logging it again.",
      "error",
    );
  });

  it("keeps each account's queue apart", async () => {
    vi.mocked(macrosApi.addEntry).mockReturnValue(new Promise(() => {}));
    const first = getEntryStore(1);
    expect(getEntryStore(1)).toBe(first);

    const second = getEntryStore(2);

    expect(second).not.toBe(first);
    expect(second.userId).toBe(2);
  });

  it("counts the writes still waiting, and sign-out clears them and the cache from the device", async () => {
    vi.mocked(macrosApi.addEntry).mockReturnValue(new Promise(() => {}));
    const store = getEntryStore(1);
    await store.entries.preload();
    await store.log({ ...lunch, mealName: "First" });
    await store.log({ ...lunch, mealName: "Second" });

    expect(await countUnsentEntries()).toBe(2);
    expect(await outboxKeys(1)).toHaveLength(2);

    await clearSignedOutAccount();

    expect(await outboxKeys(1)).toEqual([]);
    expect(await countUnsentEntries()).toBe(0);
    expect(localStorage.getItem("macrotrackr-device-account")).toBeNull();
    const { queryCachePersister } = await import("@/lib/queryClient");
    expect(queryCachePersister.removeClient).toHaveBeenCalledTimes(1);
  });

  it("clears the previous account's queue and cached data when another account signs in", async () => {
    vi.mocked(macrosApi.addEntry).mockReturnValue(new Promise(() => {}));
    const first = getEntryStore(1);
    await first.entries.preload();
    await first.log(lunch);
    queryClient.setQueryData(queryKeys.savedMeals.list(), { meals: [{ id: 9 }] });
    queryClient.setQueryData(queryKeys.auth.user(), { id: 2 });
    expect(await outboxKeys(1)).toHaveLength(1);

    getEntryStore(2);

    await vi.waitFor(async () => expect(await outboxKeys(1)).toEqual([]));
    expect(queryClient.getQueryData(queryKeys.macros.recentEntries(1))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.savedMeals.list())).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.auth.user())).toEqual({ id: 2 });
    expect(localStorage.getItem("macrotrackr-device-account")).toBe("2");
  });

  it("keeps the queue when the same account signs in again", async () => {
    vi.mocked(macrosApi.addEntry).mockReturnValue(new Promise(() => {}));
    const store = getEntryStore(1);
    await store.entries.preload();
    await store.log(lunch);

    closeEntryStore();
    getEntryStore(1);

    expect(await outboxKeys(1)).toHaveLength(1);
  });
});
