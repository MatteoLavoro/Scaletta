import { forwardRef, useId } from "react";
import FormLabel from "./FormLabel";
import FormError from "./FormError";

/**
 * DateTimePicker - Selettore data e ora per notifiche programmate
 * Layout: Date | Time (ora:minuti)
 *
 * @param {string} label - Etichetta del campo
 * @param {string} error - Messaggio di errore
 * @param {Date} value - Data/ora selezionata
 * @param {function} onChange - Callback (date) => void
 * @param {Date} minDate - Data minima selezionabile (default: ora corrente)
 */
const DateTimePicker = forwardRef(
  (
    { label, error, value, onChange, minDate, className = "", ...props },
    ref,
  ) => {
    const id = useId();
    const inputId = props.id || id;

    // Converti Date in formato input datetime-local
    const formatDateTime = (date) => {
      if (!date) return "";
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Formato minimo per datetime-local
    const minDateTime = minDate
      ? formatDateTime(minDate)
      : formatDateTime(new Date());

    const handleChange = (e) => {
      const dateTimeStr = e.target.value;
      if (!dateTimeStr) {
        onChange?.(null);
        return;
      }
      const date = new Date(dateTimeStr);
      onChange?.(date);
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && <FormLabel htmlFor={inputId}>{label}</FormLabel>}
        <input
          ref={ref}
          type="datetime-local"
          id={inputId}
          value={value ? formatDateTime(value) : ""}
          onChange={handleChange}
          min={minDateTime}
          className={`
            w-full px-4 py-3 text-base
            bg-bg-tertiary text-text-primary
            border rounded-xl
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-all duration-200
            ${error ? "border-error" : "border-divider"}
          `}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && <FormError id={`${inputId}-error`} message={error} />}
      </div>
    );
  },
);

DateTimePicker.displayName = "DateTimePicker";

export default DateTimePicker;
