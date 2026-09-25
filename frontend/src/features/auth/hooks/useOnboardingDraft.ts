import { useEffect, useState } from "react";

const DRAFT_KEY = "onboardingDraft";

function readDraft<T>(): T | undefined {
  const storedDraft = sessionStorage.getItem(DRAFT_KEY);
  if (!storedDraft) return undefined;

  try {
    return JSON.parse(storedDraft) as T;
  } catch {
    return undefined;
  }
}

export function clearOnboardingDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

/**
 * Keeps the onboarding answers across a refresh. The saved draft is restored
 * during the first render rather than in an effect, so the form never paints
 * step 1 first and the save below never overwrites the draft with blanks.
 */
export function useOnboardingDraft<T>(draft: T, restore: (saved: T) => void) {
  const [pendingDraft, setPendingDraft] = useState(readDraft<T>);

  if (pendingDraft) {
    setPendingDraft(undefined);
    restore(pendingDraft);
  }

  const serializedDraft = JSON.stringify(draft);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, serializedDraft);
  }, [serializedDraft]);
}
