import { CameraIcon } from "../icons";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Calcola la luminosità di un colore hex e determina se è chiaro o scuro
 */
const isLightColor = (hexColor) => {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};

/**
 * CameraFab - Tasto fluttuante tondo per scattare foto rapide
 *
 * Posizionato sopra la barra MobileAddFab, a destra.
 * Usa il colore accent del tema profilo.
 * Solo per mobile (1 colonna).
 *
 * @param {function} onClick - Handler per click
 */
const CameraFab = ({ onClick }) => {
  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema del profilo
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Determina il colore del testo/icona in base alla luminosità dello sfondo
  const isLight = isLightColor(primaryColor);
  const iconColor = isLight ? "#1a1a1a" : "#ffffff";

  return (
    <button
      onClick={onClick}
      className="
        fixed z-50
        w-14 h-14
        rounded-full
        shadow-lg
        flex items-center justify-center
        hover:scale-105 active:scale-95
        transition-transform duration-150
      "
      style={{
        backgroundColor: primaryColor,
        // Posizionato sopra la barra MobileAddFab (che è alta circa 88px con padding)
        // e a destra dello schermo
        bottom: "120px",
        right: "16px",
      }}
      aria-label="Scatta foto"
    >
      <CameraIcon className="w-7 h-7" style={{ color: iconColor }} />
    </button>
  );
};

export default CameraFab;
