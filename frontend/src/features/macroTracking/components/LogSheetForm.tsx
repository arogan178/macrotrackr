import { useLocation } from "@tanstack/react-router";

import { useAddEntry } from "../hooks/useAddEntry";
import { useHomeDate } from "../hooks/useHomePage";

import AddEntryForm from "./AddEntryForm";

/** The Log sheet's body, split out so the offline entry store loads with it. */
export default function LogSheetForm({ onClose }: { onClose: () => void }) {
  const { addEntry, isSaving } = useAddEntry();
  const isOnHome = useLocation({ select: (location) => location.pathname === "/home" });
  const { date, isToday } = useHomeDate();

  return (
    <AddEntryForm
      onSubmit={async (entry) => {
        await addEntry(entry);
        onClose();
      }}
      isSaving={isSaving}
      inSheet
      defaultDate={isOnHome && !isToday ? date : undefined}
    />
  );
}
