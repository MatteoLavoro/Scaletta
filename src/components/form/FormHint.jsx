/**
 * FormHint - Testo di aiuto sotto un campo
 * Usare per dare indicazioni aggiuntive all'utente
 */
const FormHint = ({ children, className = "" }) => {
  if (!children) return null;

  return (
    <p className={`text-xs text-text-muted mt-1.5 ${className}`}>{children}</p>
  );
};

export default FormHint;
