import { useState } from "react";
import { Modal } from "../modal";
import { TextField } from "../form";

/**
 * InputModal - Modale di immissione testo generico
 * Usato per modificare valori testuali
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {string} title - Titolo del modale
 * @param {string} label - Label del campo di input
 * @param {string} placeholder - Placeholder del campo
 * @param {string} initialValue - Valore iniziale
 * @param {string} confirmText - Testo del bottone conferma
 * @param {function} onConfirm - Callback conferma con nuovo valore
 * @param {function} validate - Funzione di validazione (ritorna errore o null)
 * @param {boolean} loading - Se sta caricando
 * @param {number} zIndex - z-index personalizzato per modali annidati
 */
const InputModal = ({
  isOpen,
  title = "Modifica",
  label,
  placeholder,
  initialValue = "",
  confirmText = "Salva",
  onConfirm,
  onClose, // Callback chiusura (per modali annidati)
  validate,
  loading = false,
  zIndex,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const [lastInitialValue, setLastInitialValue] = useState(initialValue);

  // Aggiorna valore quando cambia initialValue o si riapre
  if (isOpen && initialValue !== lastInitialValue) {
    setValue(initialValue);
    setError("");
    setLastInitialValue(initialValue);
  }

  const handleConfirm = async () => {
    // Validazione
    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (onConfirm) {
      await onConfirm(value);
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (error) setError("");
  };

  const isDisabled = loading || !value.trim() || value === initialValue;

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      confirmText={confirmText}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={isDisabled}
      isLoading={loading}
      zIndex={zIndex}
    >
      <div className="py-2">
        <TextField
          label={label}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          error={error}
          autoFocus
        />
      </div>
    </Modal>
  );
};

export default InputModal;
