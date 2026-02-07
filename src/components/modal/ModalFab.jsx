import { CheckIcon } from "../icons";

const ModalFab = ({ onConfirm, disabled, loading, keyboardHeight }) => {
  const bottomOffset = keyboardHeight > 0 ? keyboardHeight + 20 : 20;
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onConfirm}
      disabled={isDisabled}
      style={{
        bottom: `calc(${bottomOffset}px + var(--safe-area-inset-bottom))`,
      }}
      className={`
        fixed right-5 w-14 h-14 rounded-full z-1001
        flex items-center justify-center
        transition-all duration-200 ease-out
        ${
          isDisabled
            ? "bg-divider text-text-muted shadow-none cursor-default"
            : "bg-primary text-black shadow-lg shadow-primary/40 hover:scale-105 hover:shadow-xl hover:shadow-primary/50 active:scale-95"
        }
      `}
      aria-label="Conferma"
    >
      {loading ? (
        <div className="w-6 h-6 border-2 border-transparent border-t-current rounded-full animate-spin" />
      ) : (
        <CheckIcon className="w-6 h-6" strokeWidth={2.5} />
      )}
    </button>
  );
};

export default ModalFab;
