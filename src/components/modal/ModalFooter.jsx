import Button from "../ui/Button";

const ModalFooter = ({ confirmText, onConfirm, disabled, loading }) => {
  return (
    <>
      {/* Divider above footer */}
      <div className="px-6 shrink-0" aria-hidden="true">
        <div className="h-px bg-divider" />
      </div>

      {/* Footer with full-width confirm button */}
      <footer className="p-6 shrink-0">
        <Button
          onClick={onConfirm}
          disabled={disabled}
          loading={loading}
          className="w-full"
          size="lg"
        >
          {confirmText}
        </Button>
      </footer>
    </>
  );
};

export default ModalFooter;
