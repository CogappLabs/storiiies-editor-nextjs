"use client";

import { useState, useTransition } from "react";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import ConfirmDialog from "./ConfirmDialog";

interface ConfirmDeleteButtonProps {
  message: string;
  /** Resolves to an error message, or nothing on success. */
  onDelete: () => Promise<string | undefined>;
}

/** An admin-table "Delete" link that asks for confirmation in a dialog. */
const ConfirmDeleteButton = ({
  message,
  onDelete,
}: ConfirmDeleteButtonProps) => {
  const strings = useStrings();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const failure = await onDelete();
      if (failure) setError(failure);
      else setOpen(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-danger underline decoration-danger/30 hover:decoration-danger"
      >
        {strings.common.delete}
      </button>
      {open && (
        <ConfirmDialog
          title={strings.common.confirmDeleteTitle}
          message={message}
          confirmLabel={strings.common.delete}
          onConfirm={confirm}
          onCancel={() => setOpen(false)}
          pending={isPending}
          error={error}
        />
      )}
    </>
  );
};

export default ConfirmDeleteButton;
