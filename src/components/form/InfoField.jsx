import FormLabel from "./FormLabel";

/**
 * InfoField - Campo informativo di sola lettura
 * Mostra un valore con label, non editabile
 */
const InfoField = ({ label, value, className = "" }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <FormLabel>{label}</FormLabel>}
      <div className="px-4 py-3.5 bg-bg-tertiary text-text-primary border border-divider rounded-xl text-base">
        {value || <span className="text-text-muted">Non disponibile</span>}
      </div>
    </div>
  );
};

export default InfoField;
