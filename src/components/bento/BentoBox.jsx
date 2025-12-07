import { HEIGHT_PRESETS, resolveHeight } from "./bentoConstants";

/**
 * BentoBox - Singolo box nel layout Bento
 *
 * Box generico che può contenere vari tipi di contenuto.
 * L'altezza può essere specificata in pixel o usando preset.
 *
 * @param {Object} props
 * @param {number|string} props.height - Altezza in px o preset (sm/md/lg/xl)
 * @param {ReactNode} props.children - Contenuto del box
 * @param {string} props.className - Classi CSS aggiuntive
 * @param {Function} props.onClick - Handler click
 * @param {string} props.title - Titolo opzionale del box
 */

const BentoBox = ({
  height = "md",
  children,
  className = "",
  onClick,
  title,
}) => {
  const resolvedHeight = resolveHeight(height);

  return (
    <div
      className={`
        bg-bg-secondary 
        border border-border 
        rounded-xl
        overflow-hidden
        transition-all duration-200
        ${
          onClick
            ? "cursor-pointer hover:border-primary/50 hover:shadow-lg"
            : ""
        }
        ${className}
      `}
      style={{ height: `${resolvedHeight}px` }}
      onClick={onClick}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      {/* Header con titolo se presente */}
      {title && (
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {title}
          </h3>
        </div>
      )}

      {/* Contenuto */}
      <div
        className={`
          p-4 
          h-full 
          ${title ? "pt-0" : ""} 
          overflow-auto
        `}
        style={title ? { height: `calc(100% - 45px)` } : undefined}
      >
        {children}
      </div>
    </div>
  );
};

export default BentoBox;
