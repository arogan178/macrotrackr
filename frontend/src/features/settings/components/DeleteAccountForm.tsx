import React, { useCallback, useState } from "react";

import { ApiError } from "@/api/core";
import { userApi } from "@/api/user";
import { getButtonClasses } from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import Panel from "@/components/ui/Panel";
import { useLogout } from "@/hooks/auth/useAuthQueries";

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
  const [error, setError] = useState<string | null>(null);
  const logout = useLogout();

  const canDelete = confirmText.trim() === CONFIRM_WORD && !isDeleting;

  const handleDelete = useCallback(async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      await userApi.deleteAccount();
      // The account is gone, so the session is meaningless — clear it rather
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
        This permanently deletes your account and everything in it — every
        logged meal, your weight history, goals, macro targets, habits and saved
        meals. It cannot be undone, and we cannot recover it for you.
      </p>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        If you want a copy of your data, export it as CSV before you continue.
      </p>

      <label
        htmlFor="delete-confirm"
        className="mb-2 block text-sm font-medium text-foreground"
      >
        Type <span className="font-semibold text-error">{CONFIRM_WORD}</span> to
        confirm
      </label>
      <input
        id="delete-confirm"
        type="text"
        value={confirmText}
        onChange={(event) => setConfirmText(event.target.value)}
        autoComplete="off"
        aria-describedby={error ? "delete-error" : undefined}
        className="mb-4 w-full max-w-xs rounded-control border border-border bg-surface-2 px-3 py-2 text-foreground"
      />

      {error ? (
        <p id="delete-error" role="alert" className="mb-4 text-sm text-error">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete}
        aria-label="Permanently delete my account"
        className={getButtonClasses("danger", "md", !canDelete)}
      >
        {isDeleting ? "Deleting…" : "Delete my account"}
      </button>
    </Panel>
  );
};

export default DeleteAccountForm;
