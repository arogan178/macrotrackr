import type { MacroEntry } from "@/types/macro";

/** Shown until the server has every change to the entry. */
export function PendingSyncMarker({ entry }: { entry: MacroEntry }) {
  if (!entry.$hasPendingWrites) return null;

  return <span className="text-xs whitespace-nowrap text-muted">Waiting to sync</span>;
}
