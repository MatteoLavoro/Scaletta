import { ArrowLeftIcon, CloseIcon } from "../icons";

const ModalHeader = ({ title, isMobile, onClose }) => {
  return (
    <header
      className="flex items-center justify-between px-4 min-h-14 shrink-0"
      style={
        isMobile
          ? {
              paddingTop: "calc(0.75rem + var(--safe-area-inset-top))",
              paddingBottom: "0.75rem",
            }
          : {
              paddingTop: "0.75rem",
              paddingBottom: "0.75rem",
            }
      }
    >
      {/* Mobile: Back arrow left con cerchietto | Desktop: Spacer */}
      {isMobile ? (
        <div className="w-10 h-10 -ml-1 rounded-full bg-bg-tertiary flex items-center justify-center">
          <button
            onClick={onClose}
            className="
              flex items-center justify-center w-full h-full
              rounded-full text-text-primary
              hover:bg-divider active:bg-border
              transition-colors duration-150
            "
            aria-label="Torna indietro"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        </div>
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

      {/* Desktop: Close X right con cerchietto | Mobile: Spacer */}
      {!isMobile ? (
        <div className="w-10 h-10 -mr-1 rounded-full bg-bg-tertiary flex items-center justify-center">
          <button
            onClick={onClose}
            className="
              flex items-center justify-center w-full h-full
              rounded-full text-text-primary
              hover:bg-divider active:bg-border
              transition-colors duration-150
            "
            aria-label="Chiudi"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
      ) : (
        <div className="w-10" aria-hidden="true" />
      )}
    </header>
  );
};

export default ModalHeader;
