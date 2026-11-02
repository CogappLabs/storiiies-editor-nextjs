"use client";

import { useId, useRef } from "react";
import { useStrings } from "@/lib/i18n/LanguageProvider";
import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  error?: string | null;
}

const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  pending,
  error,
}: ConfirmDialogProps) => {
  const strings = useStrings();
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      title={title}
      titleId={`${id}-title`}
      describedById={`${id}-message`}
      onClose={onCancel}
      initialFocusRef={cancelRef}
    >
      <p id={`${id}-message`} className="text-sm">
        {message}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <Button
          ref={cancelRef}
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          {strings.common.cancel}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={onConfirm}
          disabled={pending}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
