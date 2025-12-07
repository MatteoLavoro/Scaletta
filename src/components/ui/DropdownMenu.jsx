import { useState, useRef, useEffect } from "react";
import { MoreVerticalIcon } from "../icons";

/**
 * DropdownMenu - Menu dropdown con icona kebab
 *
 * @param {Array} items - Array di oggetti { label, onClick, icon?, danger? }
 * @param {string} buttonColor - Colore del testo del bottone (default: currentColor)
 * @param {string} ariaLabel - Label accessibilità per il bottone
 * @param {boolean} compact - Modalità compatta (w-full h-full per riempire container)
 */
const DropdownMenu = ({
  items = [],
  buttonColor,
  ariaLabel = "Menu",
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
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
        closeMenu();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeMenu();
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

  // Chiude il menu con animazione
  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 150); // Durata animazione di chiusura
  };

  const handleItemClick = (item) => {
    closeMenu();
    item.onClick?.();
  };

  return (
    <div
      className={`relative ${
        compact ? "w-full h-full" : "inline-flex items-center justify-center"
      }`}
    >
      {/* Bottone kebab */}
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
        className={`
          flex items-center justify-center
          ${compact ? "w-full h-full" : "w-10 h-10 -mr-1"}
          rounded-full
          hover:bg-black/10 active:bg-black/20
          transition-colors duration-150
        `}
        style={{ color: buttonColor }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVerticalIcon className={compact ? "w-5 h-5" : "w-6 h-6"} />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute right-0 top-full mt-1
            min-w-[200px] py-1
            bg-bg-secondary border border-border rounded-xl
            shadow-lg
            z-50
            transition-all duration-150 ease-out
            origin-top-right
            ${
              isClosing
                ? "opacity-0 scale-95"
                : "opacity-100 scale-100 animate-dropdown-in"
            }
          `}
          role="menu"
        >
          {items.map((item, index) => {
            // Separatore
            if (item.separator) {
              return (
                <div
                  key={`sep-${index}`}
                  className="my-1 border-t border-border"
                />
              );
            }

            // Determina lo stile in base alla variante
            const getItemStyle = () => {
              if (item.isDangerous || item.danger) {
                return "text-red-500";
              }
              if (item.variant === "success") {
                return "text-green-500";
              }
              if (item.variant === "muted") {
                return "text-text-secondary";
              }
              return "text-text-primary";
            };

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5
                  text-sm text-left
                  ${getItemStyle()}
                  hover:bg-bg-tertiary
                  transition-colors duration-150
                `}
                role="menuitem"
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
