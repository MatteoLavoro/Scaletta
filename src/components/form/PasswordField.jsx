import { forwardRef, useState, useId } from "react";
import { Eye, EyeOff } from "lucide-react";
import FormLabel from "./FormLabel";
import FormHint from "./FormHint";
import FormError from "./FormError";

/**
 * PasswordField - Campo password con toggle visibilità
 * Include label, input con occhio, hint e gestione errori
 *
 * @param {string} label - Etichetta del campo
 * @param {string} hint - Testo di aiuto opzionale
 * @param {string} error - Messaggio di errore
 * @param {boolean} required - Mostra asterisco required
 * @param {string} size - Dimensione: "sm" | "md" | "lg"
 */
const PasswordField = forwardRef(
  (
    {
      label,
      hint,
      error,
      required = false,
      size = "md",
      className = "",
      inputClassName = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={`
              w-full ${sizes[size]} pr-12
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-secondary transition-colors"
            aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {hint && !error && <FormHint id={`${inputId}-hint`}>{hint}</FormHint>}
        {error && <FormError message={error} />}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";

export default PasswordField;
