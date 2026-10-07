import React, { useCallback, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import { ApiError } from "@/api/core";
import { goalsApi } from "@/api/goals";
import { habitsApi } from "@/api/habits";
import { macrosApi } from "@/api/macros";
import { userApi } from "@/api/user";
import { getButtonClasses } from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import {
  downloadCsv,
  downloadHistoryCsv,
} from "@/features/macroTracking/utils/historyExport";
import {
  buildHabitsCsv,
  buildWeightLogCsv,
} from "@/features/settings/utils/dataExport";
import { useLogout } from "@/hooks/auth/useAuthQueries";
import { clearSignedOutAccount } from "@/hooks/queries/macro/entryStore";
import { todayISO } from "@/utils/dateUtilities";

/** Typed exactly, or the button stays disabled. */
const CONFIRM_WORD = "DELETE";

const validateConfirm = ({ value }: { value: { confirm: string } }) =>
  value.confirm.trim() === CONFIRM_WORD
    ? undefined
    : `Type ${CONFIRM_WORD} to confirm`;

/**
 * Irreversible account deletion.
 *
 * Two deliberate choices:
 *  - Confirmation is a typed word rather than an "Are you sure?" dialog. This
 *    destroys every meal, weight entry and goal the person has, and a
 *    misplaced tap should not be able to do that.
 *  - A 409 from the server (active subscription) is surfaced verbatim, because
 *    the server's message names where to go and cancel.
 */
const DeleteAccountForm: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logout = useLogout();

  // Same CSV writers as Settings > Data, but the meal history ignores the free
  // plan's window: someone leaving gets everything they logged.
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const [history, weightLog, habits] = await Promise.all([
        macrosApi.getAllHistory({ fullExport: true }),
        goalsApi.getWeightLog(),
        habitsApi.getHabits(todayISO()),
      ]);
      downloadHistoryCsv(history.entries);
      downloadCsv(buildWeightLogCsv(weightLog), "weight");
      downloadCsv(buildHabitsCsv(habits), "habits");
    } catch {
      setError("Could not export your data. Try again before deleting.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const form = useForm({
    defaultValues: { confirm: "" },
    // onMount keeps the button disabled before anything is typed.
    validators: { onMount: validateConfirm, onChange: validateConfirm },
    onSubmit: async () => {
      setError(null);
      try {
        await userApi.deleteAccount();
        // Cleared here too: signing out of an account that no longer exists can fail.
        await clearSignedOutAccount();
        // The account is gone, so the session is meaningless. Clear it rather
        // than leaving the app holding a token for a user that no longer exists.
        logout.mutate();
      } catch (deleteError) {
        setError(
          deleteError instanceof ApiError
            ? deleteError.message
            : "Could not delete your account. Please try again.",
        );
      }
    },
  });
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const isSubmitSuccessful = useStore(
    form.store,
    (state) => state.isSubmitSuccessful,
  );
  // Once the account is gone the button stays locked, even if sign-out stalls.
  const isDeleting = isSubmitting || (isSubmitSuccessful && !error);

  return (
    <Panel className="border-error/40">
      <Heading level="panel" className="mb-2 text-error">
        Delete account
      </Heading>

      <p className="mb-4 text-sm leading-relaxed text-muted">
        Deletes your account and all your data: meals, weight history, goals,
        targets, habits and saved meals. This cannot be undone.{" "}
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || isDeleting}
          className="text-primary underline underline-offset-4 disabled:opacity-60"
        >
          {isExporting ? "Preparing your copy…" : "Download a copy first."}
        </button>
      </p>

      {/* One row, two controls. The export is a link inside the sentence rather
          than a second button: a benign action at equal weight beside a
          destructive one invites mis-clicks and made the panel read as two
          equal options. The field carries its own affordance via the
          placeholder, so the floating label above it is gone. */}
      <div className="flex flex-wrap items-center gap-3">
        <form.Field name="confirm">
          {(field) => (
            <input
              id="delete-confirm"
              type="text"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              autoComplete="off"
              placeholder={`Type ${CONFIRM_WORD}`}
              aria-label={`Type ${CONFIRM_WORD} to confirm account deletion`}
              aria-describedby={error ? "delete-error" : undefined}
              className="w-40 rounded-control border border-border bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted"
            />
          )}
        </form.Field>

        <button
          type="button"
          onClick={() => void form.handleSubmit()}
          disabled={!canSubmit || isDeleting}
          aria-label="Permanently delete my account"
          className={getButtonClasses("danger", "md", false)}
        >
          {isDeleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>

      {error ? (
        <p id="delete-error" role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      ) : null}
    </Panel>
  );
};

export default DeleteAccountForm;
