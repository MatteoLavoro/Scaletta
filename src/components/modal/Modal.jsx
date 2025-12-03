import { useEffect, useRef } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useKeyboardHeight } from "../../hooks/useKeyboardHeight";
import { useModal } from "../../contexts/ModalContext";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import ModalFab from "./ModalFab";

const Modal = ({
  isOpen,
  title,
  children,
  confirmText = "Conferma",
  onConfirm,
  onClose, // Callback chiusura personalizzata (per modali annidati)
  confirmDisabled = false,
  showConfirmButton = true,
  isLoading = false,
  variant = "default", // "default" | "info" (informativo senza tasto conferma)
  zIndex, // z-index personalizzato per modali annidati
}) => {
  const isMobile = useIsMobile();
  const keyboardHeight = useKeyboardHeight();
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const { modalDepth } = useModal();

  // Se variant è "info", non mostrare il tasto conferma
  const showConfirm = variant === "info" ? false : showConfirmButton;

  // Handle close - usa onClose se fornito, altrimenti history.back()
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.history.back();
    }
  };

  // Calcola z-index basato su profondità o valore personalizzato
  const computedZIndex = zIndex ?? 1000 + modalDepth * 10;

  // Focus trap and restore focus on close
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement;

      // Focus the modal
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap - keep focus inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Desktop only */}
      {!isMobile && (
        <div
          className="fixed inset-0 bg-black/60 animate-fade-in"
          style={{ zIndex: computedZIndex - 1 }}
          aria-hidden="true"
        />
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{ zIndex: computedZIndex }}
        className={`
          fixed flex flex-col bg-bg-secondary
          ${
            isMobile
              ? "inset-0 animate-slide-in-bottom"
              : "inset-0 m-auto w-[90%] max-w-[440px] h-fit max-h-[85vh] rounded-2xl shadow-2xl animate-modal-scale"
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <ModalHeader title={title} isMobile={isMobile} onClose={handleClose} />

        {/* Divider below header */}
        <div className="h-px bg-divider shrink-0" aria-hidden="true" />

        {/* Scrollable content area */}
        <div
          className={`
            flex-1 overflow-y-auto p-6 overscroll-contain
            ${isMobile && showConfirm ? "pb-24" : ""}
          `}
        >
          {children}
        </div>

        {/* Desktop Footer - Full-width confirm button */}
        {!isMobile && showConfirm && (
          <ModalFooter
            confirmText={confirmText}
            onConfirm={onConfirm}
            disabled={confirmDisabled}
            loading={isLoading}
          />
        )}

        {/* Mobile FAB - Floating action button that moves above keyboard */}
        {isMobile && showConfirm && (
          <ModalFab
            onConfirm={onConfirm}
            disabled={confirmDisabled}
            loading={isLoading}
            keyboardHeight={keyboardHeight}
          />
        )}
      </div>
    </>
  );
};

export default Modal;
