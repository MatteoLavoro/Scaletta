import ColorPicker from "./ColorPicker";
import ThemeSwitcher from "./ThemeSwitcher";

/**
 * ThemeSelector - Combinazione di selettore colore e tema
 * Layout responsive: colori + divider + toggle occupano tutta la riga
 */
const ThemeSelector = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-between w-full ${className}`}>
      <ColorPicker className="flex-1" />
      <div
        className="w-px h-8 bg-divider mx-2 sm:mx-3 shrink-0"
        aria-hidden="true"
      />
      <ThemeSwitcher />
    </div>
  );
};

export default ThemeSelector;
