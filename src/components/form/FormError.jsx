import { AlertCircle } from "lucide-react";

/**
 * FormError - Messaggio di errore per campi form o errori globali
 * Si mostra quando c'è un errore di validazione
 */
const FormError = ({ message, className = "", variant = "inline" }) => {
  if (!message) return null;

  // Variante inline: sotto un campo
  if (variant === "inline") {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-error mt-1.5 ${className}`}
        role="alert"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

  // Variante box: errore globale in un box evidenziato
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default FormError;
