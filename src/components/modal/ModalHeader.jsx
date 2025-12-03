import { ArrowLeft, X } from "lucide-react";

const ModalHeader = ({ title, isMobile, onClose }) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 min-h-14 shrink-0">
      {/* Mobile: Back arrow left | Desktop: Spacer */}
      {isMobile ? (
        <button
          onClick={onClose}
          className="
            flex items-center justify-center w-10 h-10 -ml-1
            rounded-full text-text-primary
            hover:bg-bg-tertiary active:bg-divider
            transition-colors duration-150
          "
          aria-label="Torna indietro"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-10" aria-hidden="true" />
      )}

      {/* Centered title */}
      <h2
        id="modal-title"
        className="text-lg font-semibold text-text-primary text-center flex-1 truncate px-2"
      >
        {title}
      </h2>

      {/* Desktop: Close X right | Mobile: Spacer */}
      {!isMobile ? (
        <button
          onClick={onClose}
          className="
            flex items-center justify-center w-10 h-10 -mr-1
            rounded-full text-text-primary
            hover:bg-bg-tertiary active:bg-divider
            transition-colors duration-150
          "
          aria-label="Chiudi"
        >
          <X className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-10" aria-hidden="true" />
      )}
    </header>
  );
};

export default ModalHeader;
