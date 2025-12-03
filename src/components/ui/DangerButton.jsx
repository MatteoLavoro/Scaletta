import { useState } from "react";
import { ConfirmModal } from "../modal";

/**
 * DangerButton - Tasto per azioni pericolose
 * Mostra un modale di conferma prima di eseguire l'azione
 *
 * @param {React.ReactNode} children - Contenuto del bottone
 * @param {string} confirmTitle - Titolo del modale di conferma
 * @param {string} confirmMessage - Messaggio del modale di conferma
 * @param {string} confirmText - Testo del bottone conferma
 * @param {function} onConfirm - Callback quando si conferma
 * @param {string} className - Classi CSS aggiuntive
 * @param {boolean} disabled - Se il bottone è disabilitato
 * @param {number} zIndex - z-index per il modale di conferma
 */
const DangerButton = ({
  children,
  confirmTitle = "Conferma",
  confirmMessage = "Sei sicuro di voler procedere?",
  confirmText = "Conferma",
  onConfirm,
  className = "",
  disabled = false,
  zIndex = 1010,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm();
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("DangerButton error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-3.5 
          font-semibold rounded-xl transition-all duration-200
          bg-error/15 text-error border border-error/30
          hover:bg-error/25 active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-default
          ${className}
        `}
      >
        {children}
      </button>

      <ConfirmModal
        isOpen={isModalOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDanger
        loading={loading}
        zIndex={zIndex}
      />
    </>
  );
};

export default DangerButton;
