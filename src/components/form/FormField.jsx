/**
 * FormField - Container per un campo form con label, input e messaggi
 * Gestisce layout e spaziatura standard
 */
const FormField = ({ children, className = "" }) => {
  return <div className={`flex flex-col gap-2 ${className}`}>{children}</div>;
};

export default FormField;
