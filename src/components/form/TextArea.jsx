import { forwardRef, useId } from "react";
import FormLabel from "./FormLabel";
import FormHint from "./FormHint";
import FormError from "./FormError";

/**
 * TextArea - Campo di testo multilinea per form nei modal
 * Include label, textarea, hint e gestione errori
 *
 * @param {string} label - Etichetta del campo
 * @param {string} hint - Testo di aiuto opzionale
 * @param {string} error - Messaggio di errore
 * @param {boolean} required - Mostra asterisco required
 * @param {number} rows - Numero di righe visibili (default: 4)
 * @param {string} size - Dimensione: "sm" | "md" | "lg"
 * @param {boolean} resize - Permetti resize (default: true)
 */
const TextArea = forwardRef(
  (
    {
      label,
      hint,
      error,
      required = false,
      rows = 4,
      size = "md",
      resize = true,
      className = "",
      textareaClassName = "",
      ...props
    },
    ref
  ) => {
    const id = useId();
    const inputId = props.id || id;

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
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full ${sizes[size]}
            bg-bg-tertiary text-text-primary
            border rounded-xl
            placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            transition-all duration-200
            ${resize ? "resize-y" : "resize-none"}
            ${error ? "border-error" : "border-divider"}
            ${textareaClassName}
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

TextArea.displayName = "TextArea";

export default TextArea;
