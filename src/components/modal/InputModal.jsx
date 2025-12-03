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
 * @param {number} minLength - Lunghezza minima del valore
 * @param {number} maxLength - Lunghezza massima del valore
 * @param {number} exactLength - Lunghezza esatta richiesta (ha priorità su min/max)
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
  minLength,
  maxLength,
  exactLength,
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
    let newValue = e.target.value;

    // Applica maxLength se definito
    const effectiveMaxLength = exactLength || maxLength;
    if (effectiveMaxLength && newValue.length > effectiveMaxLength) {
      newValue = newValue.slice(0, effectiveMaxLength);
    }

    setValue(newValue);
    if (error) setError("");
  };

  // Calcola se il bottone deve essere disabilitato
  const effectiveMinLength = exactLength || minLength;
  const isLengthValid = effectiveMinLength
    ? value.trim().length >= effectiveMinLength
    : value.trim().length > 0;

  const isDisabled = loading || !isLengthValid || value === initialValue;

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
          maxLength={exactLength || maxLength}
        />
        {exactLength && (
          <div className="text-xs text-text-muted text-right mt-1">
            {value.length}/{exactLength}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InputModal;
