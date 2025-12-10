import { AlertTriangleIcon, InfoIcon } from "../icons";
import { Modal } from "../modal";
import Button from "../ui/Button";

/**
 * ConfirmModal - Modale di conferma generico
 * Design moderno con box colorata e bottoni allineati
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {string} title - Titolo del modale
 * @param {string} message - Messaggio di conferma
 * @param {string} confirmText - Testo del bottone conferma
 * @param {string} cancelText - Testo del bottone annulla
 * @param {function} onConfirm - Callback conferma
 * @param {function} onCancel - Callback annulla
 * @param {boolean} isDanger - Se è un'azione pericolosa (rosso)
 * @param {boolean} loading - Se sta caricando
 * @param {number} zIndex - z-index personalizzato per modali annidati
 * @param {boolean} skipHistory - Se true, non usa history.back() (per modali sopra altri modali)
 */
const ConfirmModal = ({
  isOpen,
  title = "Conferma",
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  onConfirm,
  onCancel,
  isDanger = false,
  loading = false,
  zIndex,
  skipHistory = false,
}) => {
  // Handler per chiusura - via history.back o direttamente se skipHistory
  const handleClose = () => {
    if (skipHistory) {
      if (onCancel) onCancel();
    } else {
      window.history.back();
    }
  };

  // Callback interna chiamata dal Modal quando il popstate è gestito
  const handleModalClose = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  const IconComponent = isDanger ? AlertTriangleIcon : InfoIcon;

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      variant="info"
      zIndex={zIndex}
      onClose={handleModalClose}
      skipHistory={skipHistory}
    >
      <div className="flex flex-col gap-5 py-2">
        {/* Box con icona e messaggio */}
        <div
          className={`
            flex items-start gap-4 p-4 rounded-xl
            ${
              isDanger
                ? "bg-error/10 border border-error/20"
                : "bg-primary/10 border border-primary/20"
            }
          `}
        >
          {/* Icona */}
          <div
            className={`
              shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${isDanger ? "bg-error/20" : "bg-primary/20"}
            `}
          >
            <IconComponent
              className={`w-5 h-5 ${isDanger ? "text-error" : "text-primary"}`}
            />
          </div>

          {/* Messaggio */}
          <p className="text-text-primary text-sm sm:text-base leading-relaxed pt-2">
            {message}
          </p>
        </div>

        {/* Bottoni */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 border border-divider"
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            className={`flex-1 ${
              isDanger ? "bg-error! hover:bg-error/80!" : ""
            }`}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
