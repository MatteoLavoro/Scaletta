import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

/**
 * DropdownMenu - Menu dropdown con icona kebab
 *
 * @param {Array} items - Array di oggetti { label, onClick, icon?, danger? }
 * @param {string} buttonColor - Colore del testo del bottone (default: currentColor)
 * @param {string} buttonBgHover - Colore di sfondo hover del bottone
 * @param {string} ariaLabel - Label accessibilità per il bottone
 */
const DropdownMenu = ({
  items = [],
  buttonColor,
  buttonBgHover = "bg-black/10",
  ariaLabel = "Menu",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item) => {
    setIsOpen(false);
    item.onClick?.();
  };

  return (
    <div className="relative">
      {/* Bottone kebab */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-10 h-10 -mr-1
          rounded-full
          hover:${buttonBgHover} active:bg-black/20
          transition-colors duration-150
        `}
        style={{ color: buttonColor }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-6 h-6" />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className="
            absolute right-0 top-full mt-1
            min-w-[180px] py-1
            bg-bg-secondary border border-border rounded-xl
            shadow-lg
            animate-fade-in
            z-50
          "
          role="menu"
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5
                text-sm text-left
                ${item.danger ? "text-red-500" : "text-text-primary"}
                hover:bg-bg-tertiary
                transition-colors duration-150
              `}
              role="menuitem"
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
