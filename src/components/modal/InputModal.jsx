import { useState, useEffect } from "react";
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
  const [wasOpen, setWasOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Reset value quando il modale si apre (da chiuso ad aperto)
  useEffect(() => {
    if (isOpen && !wasOpen) {
      // Il modale si sta aprendo
      setValue(initialValue);
      setError("");
    }
    setWasOpen(isOpen);
  }, [isOpen, wasOpen, initialValue]);

  const handleConfirm = async () => {
    // Validazione (supporta sia sync che async)
    if (validate) {
      setIsValidating(true);
      try {
        const validationError = await Promise.resolve(validate(value));
        if (validationError) {
          setError(validationError);
          setIsValidating(false);
          return;
        }
      } catch (e) {
        setError("Errore di validazione");
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
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

  const isDisabled =
    loading || isValidating || !isLengthValid || value === initialValue;

  // Gestione tasto Invio
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isDisabled) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      confirmText={confirmText}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={isDisabled}
      isLoading={loading || isValidating}
      zIndex={zIndex}
    >
      <div className="py-2">
        <TextField
          label={label}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
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
