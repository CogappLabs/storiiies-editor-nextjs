"use client";

import { type ReactNode, type RefObject, useRef } from "react";
import { useModalFocus } from "@/lib/hooks/useModalFocus";
import { useStrings } from "@/lib/i18n/LanguageProvider";

interface ModalProps {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  describedById?: string;
}

const Modal = ({
  title,
  titleId,
  onClose,
  children,
  initialFocusRef,
  describedById,
}: ModalProps) => {
  const strings = useStrings();
  const dialogRef = useRef<HTMLDivElement>(null);
  const fallbackFocusRef = useRef<HTMLDivElement>(null);

  useModalFocus(dialogRef, initialFocusRef ?? fallbackFocusRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedById}
        tabIndex={-1}
      >
        <div
          ref={fallbackFocusRef}
          className="p-4 border-b flex items-center justify-between"
          tabIndex={-1}
        >
          <h2 className="font-medium" id={titleId}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded"
            aria-label={strings.common.close}
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
