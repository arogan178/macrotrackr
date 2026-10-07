import { lazy, Suspense } from "react";

import Modal from "@/components/ui/Modal";
import { useLogSheet } from "@/lib/logSheet";

import { LogSheetFormSkeleton } from "./HomePageSkeletons";

/** The form and the offline entry store are the heaviest things on Home; the
 *  layout should not pay for them until someone actually asks to log something. */
const LogSheetForm = lazy(() => import("./LogSheetForm"));

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

  if (!isOpen) return null;

  const onClose = () => setOpen(false);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Log a meal"
      size="lg"
      variant="form"
      hideDefaultButtons
    >
      <Suspense fallback={<LogSheetFormSkeleton />}>
        <LogSheetForm onClose={onClose} />
      </Suspense>
    </Modal>
  );
}
