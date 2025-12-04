import { DownloadIcon, CloseIcon } from "../icons";

/**
 * InstallPopup - Popup semplice per installare l'app come PWA
 * Mostra solo se l'installazione diretta è disponibile
 */
const InstallPopup = ({ isOpen, onClose, onInstall }) => {
  const handleInstall = async () => {
    const success = await onInstall?.();
    if (success) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay sfumato */}
      <div
        className="fixed inset-0 bg-black/50 z-1000 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup */}
      <div className="fixed bottom-6 left-4 right-4 z-1001 animate-slide-in-bottom sm:left-auto sm:right-6 sm:w-80">
        <div className="bg-bg-secondary rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Header con X */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DownloadIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Scaletta</h3>
                <p className="text-xs text-text-secondary">Installa l'app</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
              aria-label="Chiudi"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Bottoni */}
          <div className="p-4 pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-medium text-text-secondary bg-bg-tertiary rounded-xl hover:bg-divider transition-colors"
            >
              Non ora
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-black bg-primary rounded-xl hover:bg-primary-light transition-colors"
            >
              Installa
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InstallPopup;
