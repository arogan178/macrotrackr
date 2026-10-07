import { FREE_TIER_LIMITS } from "@shared/entitlements";
import {
  IndexedDBAdapter,
  NonRetriableError,
  type OfflineConfig,
  startOfflineExecutor,
  WebLocksLeader,
  WebOnlineDetector,
} from "@tanstack/offline-transactions";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, type PendingMutation, safeRandomUUID } from "@tanstack/react-db";
import { onlineManager } from "@tanstack/react-query";

import { ApiError } from "@/api/core";
import { macrosApi } from "@/api/macros";
import { broadcastLocalDataChange } from "@/hooks/useRealtimeSync";
import { queryCachePersister, queryClient, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";
import { addDaysISO, todayISO } from "@/utils/dateUtilities";

/** The days every account can open on Home, so all of them work offline. */
export const RECENT_ENTRY_DAYS = FREE_TIER_LIMITS.FREE_VISIBLE_HISTORY_DAYS;

export function recentEntriesStart(): string {
  return addDaysISO(todayISO(), -RECENT_ENTRY_DAYS);
}

// Stored with every queued write; renaming it strands writes already queued on devices.
const SYNC_ENTRIES = "syncEntries";

// Whose data this device holds, so the next account to sign in can clear it.
const DEVICE_ACCOUNT_KEY = "macrotrackr-device-account";

function outboxName(userId: number): string {
  return `macrotrackr-outbox-${userId}`;
}

export type EntryFields = Pick<
  MacroEntry,
  "protein" | "carbs" | "fats" | "mealType" | "mealName" | "entryDate" | "entryTime" | "ingredients"
>;

// Rows from a live query carry virtual fields that must not be written back.
function entryFields(source: EntryFields): EntryFields {
  const { protein, carbs, fats, mealType, mealName, entryDate, entryTime, ingredients } = source;

  return { protein, carbs, fats, mealType, mealName, entryDate, entryTime, ingredients };
}

/** Holds the queue while the session has expired; the writes wait for a sign-in. */
class SignInGate extends WebOnlineDetector {
  private isWaitingForSignIn = false;

  override isOnline(): boolean {
    return !this.isWaitingForSignIn && onlineManager.isOnline() && super.isOnline();
  }

  waitForSignIn(): void {
    this.isWaitingForSignIn = true;
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
  }

  resume(): void {
    if (!this.isWaitingForSignIn) return;
    this.isWaitingForSignIn = false;
    this.notifyOnline();
  }
}

/** Device clocks can step backwards; each edit still has to beat the last one. */
function nextVersion(previous: number | null | undefined): number {
  return Math.max(Date.now(), (previous ?? 0) + 1);
}

function createEntryStore(userId: number) {
  const gate = new SignInGate();

  const entries = createCollection(
    queryCollectionOptions({
      id: `macro-entries-${userId}`,
      queryKey: queryKeys.macros.recentEntries(userId),
      queryFn: async ({ queryKey }) => {
        try {
          return (await macrosApi.getAllHistory({ startDate: recentEntriesStart() })).entries;
        } catch (error) {
          // A failed first load would put the collection in an error state that
          // refuses new entries. Start empty instead; a later fetch fills it in.
          if (queryClient.getQueryData(queryKey) === undefined) return [];
          throw error;
        }
      },
      queryClient,
      getKey: (entry: MacroEntry) => entry.clientId,
      staleTime: queryConfigs.macros.staleTime,
      refetchInterval: queryConfigs.macros.refetchInterval,
    }),
  );

  // The retry policy reads "400", "401", "403" or "422" anywhere in a message as
  // permanent and drops the write, so no server text may reach it.
  function toQueueError(error: unknown): Error {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.code === "ACCOUNT_NOT_SYNCED") {
        gate.waitForSignIn();

        return new Error("Waiting for sign-in");
      }
      if (error.status < 500 && error.status !== 408 && error.status !== 429) {
        useStore
          .getState()
          .showNotification(
            "The server turned down an entry, so it was removed. Try logging it again.",
            "error",
          );

        return new NonRetriableError("Rejected by the server");
      }
    }

    return new Error("Will retry");
  }

  async function send(mutation: PendingMutation<MacroEntry>) {
    if (mutation.type === "delete") {
      const clientId = String(mutation.key);
      await macrosApi.deleteEntry(clientId);
      try {
        await entries.utils.writeDelete(clientId);
      } catch {
        // It never reached this device's synced copy, so there is nothing to remove.
      }

      return;
    }

    const write = { ...mutation.modified, clientUpdatedAt: mutation.modified.clientUpdatedAt ?? 0 };
    const saved =
      mutation.type === "insert"
        ? await macrosApi.addEntry(write)
        : await macrosApi.replaceEntry(write);
    // Lands before the optimistic row is dropped, so the entry never blinks out.
    await entries.utils.writeUpsert(saved);
  }

  const syncEntries: OfflineConfig["mutationFns"][string] = async ({ transaction }) => {
    try {
      for (const mutation of transaction.mutations as unknown as Array<PendingMutation<MacroEntry>>) {
        await send(mutation);
      }
    } catch (error) {
      throw toQueueError(error);
    }
    void queryClient.invalidateQueries({ queryKey: queryKeys.macros.all(), refetchType: "none" });
    broadcastLocalDataChange("macros");
  };

  const executor = startOfflineExecutor({
    collections: { entries },
    mutationFns: { [SYNC_ENTRIES]: syncEntries },
    // One outbox per account, so a write queued by one account is never sent as another.
    storage: new IndexedDBAdapter(outboxName(userId), "transactions"),
    // The library's default lock name is shared, so an account switch could find it still held.
    leaderElection: WebLocksLeader.isSupported()
      ? new WebLocksLeader(outboxName(userId))
      : undefined,
    onlineDetector: gate,
  });

  async function queue(change: () => void) {
    await executor.waitForInit();
    const isDurable = executor.isOfflineEnabled;
    const transaction = executor.createOfflineTransaction({
      mutationFnName: SYNC_ENTRIES,
      autoCommit: false,
    });
    transaction.mutate(change);
    transaction.commit().catch(() => {
      // A queued write that fails for good has already said so in toQueueError.
      if (!isDurable) {
        useStore
          .getState()
          .showNotification(
            "That entry wasn't saved. MacroTrackr is open in another tab, and only one tab can save while offline.",
            "error",
          );
      }
    });
  }

  return {
    userId,
    entries,

    log(input: EntryFields) {
      return queue(() => {
        entries.insert({
          ...entryFields(input),
          id: 0,
          clientId: safeRandomUUID(),
          clientUpdatedAt: nextVersion(undefined),
          createdAt: new Date().toISOString(),
        });
      });
    },

    /** Entries older than the device's window are edited online only. */
    async replace(entry: MacroEntry) {
      if (!entries.has(entry.clientId)) {
        await macrosApi.replaceEntry({
          ...entryFields(entry),
          clientId: entry.clientId,
          clientUpdatedAt: nextVersion(entry.clientUpdatedAt),
        });
        await queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });

        return;
      }
      await queue(() => {
        entries.update(entry.clientId, (draft) => {
          Object.assign(draft, entryFields(entry), {
            clientUpdatedAt: nextVersion(draft.clientUpdatedAt),
          });
        });
      });
    },

    async remove(clientId: string) {
      if (!entries.has(clientId)) {
        await macrosApi.deleteEntry(clientId);
        await queryClient.invalidateQueries({ queryKey: queryKeys.macros.all() });

        return;
      }
      await queue(() => {
        entries.delete(clientId);
      });
    },

    resumeAfterSignIn() {
      gate.resume();
    },

    /** Writes made on this device that the server has not confirmed yet. */
    async countUnsent() {
      await executor.waitForInit();

      return (await executor.peekOutbox()).length;
    },

    dispose() {
      executor.dispose();
      void entries.cleanup();
    },
  };
}

export type EntryStore = ReturnType<typeof createEntryStore>;

let current: EntryStore | undefined;

function deviceAccount(): number | undefined {
  return Number(localStorage.getItem(DEVICE_ACCOUNT_KEY)) || undefined;
}

/** Removes an account's queued writes and cached data from this device. */
async function clearAccountData(userId: number, keepUserId?: number): Promise<void> {
  await new IndexedDBAdapter(outboxName(userId), "transactions").clear();
  await queryClient.resetQueries({
    predicate: ({ queryKey }) =>
      queryKey[0] !== "auth" &&
      !(queryKey[1] === "recent-entries" && queryKey[2] === keepUserId),
  });
}

/** One store per signed-in account; another account signing in clears the last one's data. */
export function getEntryStore(userId: number): EntryStore {
  if (current?.userId !== userId) {
    closeEntryStore();
    const previous = deviceAccount();
    if (previous !== undefined && previous !== userId) {
      void clearAccountData(previous, userId);
    }
    localStorage.setItem(DEVICE_ACCOUNT_KEY, String(userId));
    current = createEntryStore(userId);
  }

  return current;
}

/** Closes the store; queued writes stay on the device for the same account. */
export function closeEntryStore(): void {
  current?.dispose();
  current = undefined;
}

export async function countUnsentEntries(): Promise<number> {
  return current ? current.countUnsent() : 0;
}

/** Sign-out and account deletion: nothing of the account stays on the device. */
export async function clearSignedOutAccount(): Promise<void> {
  const userId = current?.userId ?? deviceAccount();
  closeEntryStore();
  localStorage.removeItem(DEVICE_ACCOUNT_KEY);
  if (userId !== undefined) {
    await new IndexedDBAdapter(outboxName(userId), "transactions").clear();
  }
  await queryCachePersister.removeClient();
}
