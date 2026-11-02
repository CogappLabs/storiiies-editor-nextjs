import { type RefObject, useEffect, useRef } from "react";
import { trapFocus } from "@/lib/a11y";

/**
 * Hook for managing modal focus behavior:
 * - Traps focus within the modal
 * - Closes on Escape key
 * - Returns focus to the previously focused element on close
 */
export const useModalFocus = (
  dialogRef: RefObject<HTMLElement | null>,
  focusTargetRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) => {
  const returnFocusRef = useRef<Element | null>(null);
  // Callers pass inline arrows; depending on onClose would re-run the effect
  // on every parent render and steal focus back to the dialog.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
      }
      trapFocus(dialogRef.current, e);
    };

    returnFocusRef.current = document.activeElement;
    const focusTarget = focusTargetRef.current || dialogRef.current;
    focusTarget?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const previous = returnFocusRef.current;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [dialogRef, focusTargetRef]);
};
