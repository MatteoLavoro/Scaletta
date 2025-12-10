import { useState, useRef, useEffect } from "react";
import { MoreVerticalIcon } from "../icons";

/**
 * DropdownMenu - Menu dropdown con icona kebab
 * Supporta gruppi di items separati visivamente
 *
 * @param {Array} items - Array di oggetti { label, onClick, icon?, danger?, separator? }
 *                        Usa { separator: true } per dividere i gruppi
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

  // Dividi gli items in gruppi basandosi sui separatori
  const itemGroups = [];
  let currentGroup = [];

  items.forEach((item) => {
    if (item.separator) {
      if (currentGroup.length > 0) {
        itemGroups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(item);
    }
  });

  // Aggiungi l'ultimo gruppo se non vuoto
  if (currentGroup.length > 0) {
    itemGroups.push(currentGroup);
  }

  // Determina lo stile in base alla variante dell'item
  const getItemStyle = (item) => {
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

      {/* Menu dropdown - Gruppi separati */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`
            absolute right-0 top-full mt-1
            min-w-[200px]
            flex flex-col gap-2
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
          {itemGroups.map((group, groupIndex) => (
            <div
              key={`group-${groupIndex}`}
              className="bg-bg-secondary border border-border rounded-xl shadow-lg py-1 overflow-hidden"
            >
              {group.map((item, itemIndex) => (
                <button
                  key={`${groupIndex}-${itemIndex}`}
                  onClick={() => handleItemClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5
                    text-sm text-left
                    ${getItemStyle(item)}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
