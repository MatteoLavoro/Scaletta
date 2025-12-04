import { forwardRef, useId, useRef, useEffect } from "react";
import FormLabel from "./FormLabel";
import FormHint from "./FormHint";
import FormError from "./FormError";

/**
 * TextField - Campo di testo standard per form nei modal
 * Include label, input, hint e gestione errori
 *
 * @param {string} label - Etichetta del campo
 * @param {string} hint - Testo di aiuto opzionale
 * @param {string} error - Messaggio di errore
 * @param {boolean} required - Mostra asterisco required
 * @param {string} size - Dimensione: "sm" | "md" | "lg"
 * @param {boolean} autoFocus - Focus automatico sul campo
 */
const TextField = forwardRef(
  (
    {
      label,
      hint,
      error,
      required = false,
      size = "md",
      className = "",
      inputClassName = "",
      autoFocus = false,
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputId = props.id || id;
    const internalRef = useRef(null);
    const inputRef = ref || internalRef;

    // Gestione autoFocus con delay per assicurarsi che il modale sia montato
    useEffect(() => {
      if (autoFocus && inputRef.current) {
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, inputRef]);

    const sizes = {
      sm: "px-3 py-2.5 text-sm",
      md: "px-4 py-3.5 text-base",
      lg: "px-4 py-4 text-lg",
    };

    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {label && (
          <FormLabel htmlFor={inputId} required={required}>
            {label}
          </FormLabel>
        )}
        <input
          ref={inputRef}
          id={inputId}
          className={`
            w-full ${sizes[size]}
            bg-bg-tertiary text-text-primary
            border rounded-xl
            placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-all duration-200
            ${error ? "border-error" : "border-divider"}
            ${inputClassName}
          `}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {hint && !error && <FormHint id={`${inputId}-hint`}>{hint}</FormHint>}
        {error && <FormError message={error} />}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export default TextField;
