import { createContext, useContext } from "react";

import type { EntryHistoryController } from "./EntryHistoryShared";

const EntryHistoryContext = createContext<EntryHistoryController | null>(null);

const useEntryHistoryController = (): EntryHistoryController => {
  const controller = useContext(EntryHistoryContext);
  if (!controller) {
    throw new Error(
      "useEntryHistoryController must be used within EntryHistoryContext.Provider",
    );
  }

  return controller;
};

export { EntryHistoryContext, useEntryHistoryController };
