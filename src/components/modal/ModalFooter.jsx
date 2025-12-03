import Button from "../ui/Button";

const ModalFooter = ({ confirmText, onConfirm, disabled, loading }) => {
  return (
    <>
      {/* Divider above footer */}
      <div className="h-px bg-divider shrink-0" aria-hidden="true" />

      {/* Footer with full-width confirm button */}
      <footer className="p-4 shrink-0">
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
