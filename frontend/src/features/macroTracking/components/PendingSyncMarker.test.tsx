import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";
import { closeEntryStore, getEntryStore } from "@/hooks/queries/macro/entryStore";
import { queryClient } from "@/lib/queryClient";
import type { MacroEntry } from "@/types/macro";

import { EntryCard } from "./EntryCard";

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

Object.defineProperty(navigator, "locks", {
  configurable: true,
  value: {
    request: (_name: string, _options: object, callback: (lock: object) => unknown) =>
      Promise.resolve(callback({})),
  },
});

const synced: MacroEntry = {
  id: 1,
  clientId: "synced-1",
  clientUpdatedAt: 1,
  createdAt: "2026-10-01 08:00:00",
  protein: 20,
  carbs: 30,
  fats: 5,
  mealType: "breakfast",
  mealName: "Synced oats",
  entryDate: "2026-10-01",
  entryTime: "08:00",
};

function renderEntries(entries: MacroEntry[]) {
  return render(
    <>
      {entries.map((entry) => (
        <section key={entry.clientId} aria-label={entry.mealName}>
          <EntryCard
            entry={entry}
            onEdit={() => {}}
            deleteEntry={() => {}}
            isDeleting={false}
            formatTimeFromEntry={(row) => row.entryTime}
            capitalizeFirstLetter={(text) => text}
            calculateCalories={() => 0}
          />
        </section>
      ))}
    </>,
  );
}

const markerIn = (mealName: string) =>
  screen.getByRole("region", { name: mealName }).textContent?.includes("Waiting to sync");

describe("pending sync marker", () => {
  afterEach(() => {
    closeEntryStore();
    queryClient.clear();
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("marks a queued entry until the server confirms it, and never a synced one", async () => {
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({ entries: [synced] });
    let confirm: (entry: MacroEntry) => void = () => {};
    vi.mocked(macrosApi.addEntry).mockImplementation(
      (entry) =>
        new Promise((resolve) => {
          confirm = () => resolve({ ...(entry as MacroEntry), id: 2 });
        }),
    );
    const store = getEntryStore(1);
    await store.entries.preload();

    await store.log({ ...synced, mealName: "Queued eggs" });
    await vi.waitFor(() => expect(macrosApi.addEntry).toHaveBeenCalled());

    const { unmount } = renderEntries(store.entries.toArray);
    expect(markerIn("Queued eggs")).toBe(true);
    expect(markerIn("Synced oats")).toBe(false);
    unmount();

    confirm(synced);
    await vi.waitFor(() =>
      expect(store.entries.toArray.every((entry) => !entry.$hasPendingWrites)).toBe(true),
    );
    renderEntries(store.entries.toArray);
    expect(screen.queryByText("Waiting to sync")).toBeNull();
  });

  it("marks a queued edit", async () => {
    vi.mocked(macrosApi.getAllHistory).mockResolvedValue({ entries: [synced] });
    vi.mocked(macrosApi.replaceEntry).mockReturnValue(new Promise(() => {}));
    const store = getEntryStore(1);
    await store.entries.preload();

    await store.replace({ ...synced, protein: 25 });

    renderEntries(store.entries.toArray);
    expect(markerIn("Synced oats")).toBe(true);
  });
});
