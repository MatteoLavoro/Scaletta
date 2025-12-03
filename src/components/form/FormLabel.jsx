/**
 * FormLabel - Etichetta standard per campi form
 * Usare sopra ogni campo di input per indicare cosa inserire
 */
const FormLabel = ({ children, htmlFor, required = false, className = "" }) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-text-secondary ${className}`}
    >
      {children}
      {required && <span className="text-error ml-0.5">*</span>}
    </label>
  );
};

export default FormLabel;
