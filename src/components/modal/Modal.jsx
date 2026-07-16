import { useEffect, useRef, useCallback } from "react";
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
  skipHistory = false, // Skip history management (per modali sopra altri modali)
  maxWidth = "max-w-[440px]", // Larghezza massima desktop (default: 440px)
}) => {
  const isMobile = useIsMobile();
  const keyboardHeight = useKeyboardHeight();
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const hasAddedHistoryRef = useRef(false);
  const hasSetOverflowRef = useRef(false);
  const fixedZIndexRef = useRef(null);
  const { modalDepth, registerNestedClose, hasNestedModals } = useModal();
  // Calcola e fissa lo z-index alla prima apertura
  if (fixedZIndexRef.current === null && isOpen) {
    fixedZIndexRef.current = zIndex ?? 1000 + modalDepth * 10;
  }

  // Reset z-index quando il modale si chiude
  useEffect(() => {
    if (!isOpen) {
      fixedZIndexRef.current = null;
    }
  }, [isOpen]);

  const computedZIndex = fixedZIndexRef.current ?? zIndex ?? 1000;
  // Se variant è "info", non mostrare il tasto conferma
  const showConfirm = variant === "info" ? false : showConfirmButton;

  // Handle close - chiude via history.back() o direttamente tramite callback
  const handleClose = useCallback(() => {
    if (skipHistory && onClose) {
      // Se skipHistory è true, chiudi direttamente senza toccare la history
      onClose();
    } else {
      window.history.back();
    }
  }, [skipHistory, onClose]);

  // Gestione history per modali annidati (solo se non skipHistory)
  useEffect(() => {
    if (isOpen && onClose && !skipHistory) {
      // Modale annidato: aggiungi entry nella history
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ nestedModal: true }, "");
        hasAddedHistoryRef.current = true;
      }

      // Registra callback per quando popstate viene triggerato
      const unregister = registerNestedClose(onClose);
      return unregister;
    }

    // Reset quando il modale si chiude
    if (!isOpen) {
      hasAddedHistoryRef.current = false;
    }
  }, [isOpen, onClose, registerNestedClose, skipHistory]);

  // Blocca scroll del body quando il modale è aperto
  useEffect(() => {
    if (isOpen) {
      // Solo se non è un modale annidato (skipHistory false significa che è gestito dal context)
      if (!onClose || skipHistory) {
        // Compensa la larghezza della scrollbar per evitare lo scatto del layout.
        if (document.body.style.overflow !== "hidden") {
          const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;
          if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
          }
        }
        document.body.style.overflow = "hidden";
        hasSetOverflowRef.current = true;
      }
      return () => {
        // Ripristina overflow solo se questo modale l'ha impostato
        // e non ci sono modali annidati aperti
        if (hasSetOverflowRef.current && !hasNestedModals()) {
          document.body.style.overflow = "";
          document.body.style.paddingRight = "";
          hasSetOverflowRef.current = false;
        }
      };
    }
  }, [isOpen, onClose, skipHistory, hasNestedModals]);

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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  // Determina se questo è un modale annidato
  const isNestedModal = onClose && !skipHistory;

  return (
    <>
      {/* Overlay - Desktop or Nested Modal */}
      {(!isMobile || isNestedModal) && (
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
        style={{
          zIndex: computedZIndex,
        }}
        className={`
          fixed flex flex-col bg-bg-secondary
          ${
            isMobile
              ? "inset-0 animate-slide-in-bottom"
              : `inset-0 m-auto w-[90%] ${maxWidth} h-fit max-h-[85vh] rounded-2xl shadow-2xl animate-modal-scale overflow-hidden`
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <ModalHeader title={title} isMobile={isMobile} onClose={handleClose} />

        {/* Divider below header */}
        <div className="px-6 shrink-0" aria-hidden="true">
          <div className="h-px bg-divider" />
        </div>

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
