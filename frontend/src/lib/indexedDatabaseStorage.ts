/**
 * The query cache's string store in IndexedDB. Small on purpose: it loads on
 * every page, so it cannot pull in the offline-transactions adapter.
 */
export function createIndexedDatabaseStorage(databaseName: string) {
  const storeName = "entries";
  let database: Promise<IDBDatabase> | undefined;

  function open(): Promise<IDBDatabase> {
    database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(storeName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return database;
  }

  async function run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const store = (await open()).transaction(storeName, mode).objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = action(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return {
    getItem: async (key: string) =>
      ((await run("readonly", (store) => store.get(key))) as string | undefined) ?? null,
    setItem: async (key: string, value: string) => {
      await run("readwrite", (store) => store.put(value, key));
    },
    removeItem: async (key: string) => {
      await run("readwrite", (store) => store.delete(key));
    },
  };
}
