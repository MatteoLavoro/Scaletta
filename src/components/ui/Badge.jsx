/**
 * Badge - Badge compatto con contatore
 *
 * @param {number|string} count - Numero o testo da mostrare
 * @param {string} label - Etichetta (es. "Progetti")
 * @param {string} variant - Variante colore: "primary" | "secondary" | "muted"
 */
const Badge = ({ count, label, variant = "primary" }) => {
  const variantClasses = {
    primary: "bg-primary/15 text-primary border-primary/30",
    secondary: "bg-bg-tertiary text-text-secondary border-border",
    muted: "bg-bg-tertiary text-text-muted border-border",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-xs font-medium
        rounded-lg border
        ${variantClasses[variant] || variantClasses.primary}
      `}
    >
      <span className="font-semibold">{count}</span>
      {label && <span>{label}</span>}
    </span>
  );
};

export default Badge;
