import { lazy, Suspense } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import { useLogSheet } from "@/lib/logSheet";

import { useAddEntry } from "../hooks/useAddEntry";

/** The form is the heaviest thing on Home; the layout should not pay for it
 *  until someone actually asks to log something. */
const AddEntryForm = lazy(() => import("./AddEntryForm"));

/**
 * Logging, available from wherever the user already is.
 *
 * This used to live on Home, which meant the tab bar's + had to navigate there
 * first — so pressing it from Goals or Analytics threw away whatever the user
 * was in the middle of. Mounted by the layout instead, it opens over the
 * current page and closes back to it.
 */
export default function LogSheet() {
  const [isOpen, setOpen] = useLogSheet();

  // The mutations live in the inner component so that mounting this in the
  // layout costs nothing on the pages where nobody opens it.
  if (!isOpen) return null;

  return <LogSheetContent onClose={() => setOpen(false)} />;
}

function LogSheetContent({ onClose }: { onClose: () => void }) {
  const { addEntry, isSaving } = useAddEntry();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Log a meal"
      size="lg"
      variant="form"
      hideDefaultButtons
    >
      <Suspense
        fallback={
          <div className="flex justify-center py-10">
            <LoadingSpinner />
          </div>
        }
      >
        <AddEntryForm
          onSubmit={async (entry) => {
            await addEntry(entry);
            onClose();
          }}
          isSaving={isSaving}
        />
      </Suspense>
    </Modal>
  );
}
