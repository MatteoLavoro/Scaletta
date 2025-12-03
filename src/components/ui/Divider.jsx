/**
 * Divider - Linea di separazione orizzontale
 * Non arriva fino ai bordi (ha margine laterale)
 *
 * @param {string} className - Classi aggiuntive
 * @param {string} spacing - Spaziatura verticale: "sm" | "md" | "lg"
 */
const Divider = ({ className = "", spacing = "md" }) => {
  const spacingClasses = {
    sm: "my-2",
    md: "my-4",
    lg: "my-6",
  };

  return (
    <div
      className={`h-px bg-divider mx-4 ${spacingClasses[spacing]} ${className}`}
      aria-hidden="true"
    />
  );
};

export default Divider;
