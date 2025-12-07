import { PlusIcon, FileTextIcon } from "../icons";
import { BOX_WIDTH } from "../../hooks/useColumnCount";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * BoxTypeButton - Singolo tasto per tipo di box
 * @param {boolean} large - Se true usa icone più grandi (desktop)
 */
const BoxTypeButton = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  large = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center gap-1
      border-2 border-dashed border-border rounded-lg
      ${large ? "p-3" : "p-2"}
      transition-all duration-200
      ${
        disabled
          ? "opacity-30 cursor-not-allowed"
          : "text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 active:bg-primary/10"
      }
    `}
    aria-label={disabled ? `${label} (non disponibile)` : `Aggiungi ${label}`}
  >
    {Icon ? (
      <Icon className={large ? "w-10 h-10" : "w-6 h-6"} />
    ) : (
      <PlusIcon className={`${large ? "w-10 h-10" : "w-6 h-6"} opacity-30`} />
    )}
    {label && (
      <span
        className={`${
          large ? "text-sm" : "text-xs"
        } font-medium truncate w-full text-center`}
      >
        {label}
      </span>
    )}
  </button>
);

/**
 * AddBentoBoxButton - Tasto per aggiungere un nuovo Bento Box
 *
 * Griglia 2x2 con tipi di box disponibili
 * (Su mobile viene usato MobileAddFab invece di questo componente)
 *
 * @param {function} onAddNote - Handler per aggiungere una nota
 * @param {string} className - Classi CSS aggiuntive
 */
const AddBentoBoxButton = ({ onAddNote, className = "" }) => {
  return (
    <div
      className={`
        aspect-square
        w-full
        bg-bg-secondary
        border border-border
        rounded-xl
        p-3
        grid grid-cols-2 gap-2
        ${className}
      `}
    >
      <BoxTypeButton
        icon={FileTextIcon}
        label="Nota"
        onClick={onAddNote}
        large
      />
      <BoxTypeButton icon={null} label="" disabled large />
      <BoxTypeButton icon={null} label="" disabled large />
      <BoxTypeButton icon={null} label="" disabled large />
    </div>
  );
};

/**
 * Calcola la luminosità di un colore hex e determina se è chiaro o scuro
 * Usa la formula di luminosità relativa W3C
 * @param {string} hexColor - Colore in formato #RRGGBB
 * @returns {boolean} - true se il colore è chiaro, false se scuro
 */
const isLightColor = (hexColor) => {
  // Rimuovi # se presente
  const hex = hexColor.replace("#", "");

  // Converti in RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calcola luminosità relativa (formula W3C)
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Se luminosità > 0.5, il colore è chiaro
  return luminance > 0.5;
};

/**
 * MobileAddFab - Barra flottante per mobile
 * Larga quanto la colonna dei box (BOX_WIDTH)
 * Usa il colore del tema del profilo (accent color)
 * Il colore del testo si adatta automaticamente in base alla luminosità dello sfondo
 *
 * @param {function} onAddNote - Handler per aggiungere una nota
 */
export const MobileAddFab = ({ onAddNote }) => {
  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema del profilo
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Colore di sfondo
  const bgColor = primaryColor;

  // Determina il colore del testo in base alla luminosità dello sfondo
  // Se lo sfondo è chiaro -> testo scuro, se lo sfondo è scuro -> testo chiaro
  const isLight = isLightColor(primaryColor);
  const textColor = isLight ? "#1a1a1a" : "#ffffff";

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-2">
      <div
        className="rounded-2xl p-3 shadow-lg grid grid-cols-4 gap-2 w-full"
        style={{
          backgroundColor: bgColor,
        }}
      >
        {/* Nota - attivo */}
        <button
          onClick={onAddNote}
          className="
            flex flex-col items-center justify-center gap-1
            border-2 border-dashed rounded-lg
            p-2
            transition-all duration-200
            hover:opacity-80 active:opacity-60
          "
          style={{ borderColor: `${textColor}50`, color: textColor }}
          aria-label="Aggiungi Nota"
        >
          <FileTextIcon className="w-6 h-6" />
          <span className="text-xs font-medium">Nota</span>
        </button>

        {/* Bottoni disabilitati */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              flex flex-col items-center justify-center gap-1
              border-2 border-dashed rounded-lg
              p-2
              opacity-30 cursor-not-allowed
            "
            style={{ borderColor: `${textColor}30`, color: textColor }}
          >
            <PlusIcon className="w-6 h-6" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddBentoBoxButton;
