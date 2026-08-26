import React, { useCallback, useState } from "react";

import { ApiError } from "@/api/core";
import { macrosApi } from "@/api/macros";
import { userApi } from "@/api/user";
import { getButtonClasses } from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import { downloadHistoryCsv } from "@/features/macroTracking/utils/historyExport";
import { useLogout } from "@/hooks/auth/useAuthQueries";
import type { MacroEntry } from "@/types/macro";

/** Typed exactly, or the button stays disabled. */
const CONFIRM_WORD = "DELETE";

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
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logout = useLogout();

  // Same call and same CSV writer the Entry History export uses, rather than a
  // second implementation that could drift from it.
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    try {
      const response = await macrosApi.getAllHistory();
      downloadHistoryCsv(response.entries as MacroEntry[]);
    } catch {
      setError("Could not export your history. Try again before deleting.");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const canDelete = confirmText.trim() === CONFIRM_WORD && !isDeleting;

  const handleDelete = useCallback(async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await userApi.deleteAccount();
      // The account is gone, so the session is meaningless. Clear it rather
      // than leaving the app holding a token for a user that no longer exists.
      logout.mutate();
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError
          ? deleteError.message
          : "Could not delete your account. Please try again.",
      );
      setIsDeleting(false);
    }
  }, [canDelete, logout]);

  return (
    <Panel className="border-error/40">
      <Heading level="panel" className="mb-2 text-error">
        Delete account
      </Heading>

      <p className="mb-4 text-sm leading-relaxed text-muted">
        Deletes your account and all your data: meals, weight history, goals,
        targets, habits and saved meals. This cannot be undone.
      </p>

      {/* One row: take a copy, confirm, delete. Previously five stacked blocks,
          which made a routine settings panel look like a wizard. */}
      <div className="flex flex-wrap items-end gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting || isDeleting}
          aria-label="Download my data as CSV before deleting"
          className={getButtonClasses("secondary", "md", false)}
        >
          {isExporting ? "Preparing…" : "Download a copy (CSV)"}
        </button>

        <div>
          <label
            htmlFor="delete-confirm"
            className="mb-1 block text-xs text-muted"
          >
            Type <span className="font-semibold text-error">{CONFIRM_WORD}</span>{" "}
            to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            aria-describedby={error ? "delete-error" : undefined}
            className="w-32 rounded-control border border-border bg-surface-2 px-3 py-2 text-foreground"
          />
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete}
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
