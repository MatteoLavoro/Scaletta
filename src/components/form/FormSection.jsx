/**
 * FormSection - Raggruppa campi correlati con titolo opzionale
 * Usare per separare logicamente diverse sezioni di un form
 */
const FormSection = ({ title, description, children, className = "" }) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-base font-semibold text-text-primary">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-text-secondary">{description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
};

export default FormSection;
