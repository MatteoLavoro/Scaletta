/**
 * FormDivider - Linea di separazione tra sezioni
 */
const FormDivider = ({ className = "" }) => {
  return <div className={`h-px bg-divider my-2 ${className}`} />;
};

export default FormDivider;
