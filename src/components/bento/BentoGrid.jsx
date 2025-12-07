import useBentoLayout from "./useBentoLayout";

/**
 * BentoGrid - Container per il layout Bento Box
 *
 * Distribuisce automaticamente i box su 1, 2 o 3 colonne in base
 * alla larghezza dello schermo, bilanciando le altezze delle colonne.
 *
 * @param {Object} props
 * @param {Array} props.items - Array di box con { id, height, ...data }
 * @param {Function} props.children - Render function: (item) => ReactNode
 * @param {number} props.gap - Spazio tra i box in pixel (default: 16)
 * @param {string} props.className - Classi CSS aggiuntive
 */
const BentoGrid = ({ items = [], children, gap = 16, className = "" }) => {
  const { columns } = useBentoLayout(items, gap);

  // Se non ci sono items, non renderizzare nulla
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex w-full ${className}`}
      style={{ gap: `${gap}px` }}
      role="grid"
      aria-label="Griglia contenuti"
    >
      {columns.map((columnItems, columnIndex) => (
        <div
          key={`column-${columnIndex}`}
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
          role="rowgroup"
        >
          {columnItems.map((item) => children(item))}
        </div>
      ))}
    </div>
  );
};

export default BentoGrid;
