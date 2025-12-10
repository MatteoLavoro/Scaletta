import {
  PlusIcon,
  FileTextIcon,
  ImageIcon,
  FolderIcon,
  MoreHorizontalIcon,
} from "../icons";
import { BOX_WIDTH } from "../../hooks/useColumnCount";
import { useTheme } from "../../contexts/ThemeContext";

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
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Se luminosità > 0.5, il colore è chiaro
  return luminance > 0.5;
};

/**
 * AddBentoBoxButton - DEPRECATO: ora usiamo DesktopAddFab
 * Mantenuto per retrocompatibilità
 */
const AddBentoBoxButton = ({
  onAddNote,
  onAddPhoto,
  onAddFile,
  className = "",
}) => {
  // Redirect al nuovo componente
  return (
    <DesktopAddFab
      onAddNote={onAddNote}
      onAddPhoto={onAddPhoto}
      onAddFile={onAddFile}
    />
  );
};

/**
 * DesktopAddFab - Barra flottante per desktop
 * Simile a MobileAddFab ma con dimensioni adattate per desktop
 * Larghezza fissa di una colonna (BOX_WIDTH)
 *
 * @param {function} onAddNote - Handler per aggiungere una nota
 * @param {function} onAddPhoto - Handler per aggiungere una foto
 * @param {function} onAddFile - Handler per aggiungere un file
 * @param {function} onMoreClick - Handler per aprire il menu "Altro"
 */
export const DesktopAddFab = ({
  onAddNote,
  onAddPhoto,
  onAddFile,
  onMoreClick,
}) => {
  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema del profilo
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Colori per i tasti - design moderno con contrasto elevato
  const buttonBgColor = isDark
    ? "rgba(38, 38, 38, 0.95)"
    : "rgba(255, 255, 255, 0.95)";

  const buttonTextColor = isDark ? "#e5e5e5" : "#404040";

  const buttonHoverBg = isDark
    ? "rgba(50, 50, 50, 1)"
    : "rgba(245, 245, 245, 1)";

  const disabledBgColor = isDark
    ? "rgba(38, 38, 38, 0.4)"
    : "rgba(255, 255, 255, 0.4)";

  const disabledTextColor = isDark
    ? "rgba(229, 229, 229, 0.3)"
    : "rgba(64, 64, 64, 0.3)";

  return (
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center">
      <div
        className="rounded-2xl p-2 shadow-xl grid grid-cols-4 gap-2"
        style={{
          width: `${BOX_WIDTH}px`,
          backgroundColor: primaryColor,
          boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 12px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Nota */}
        <button
          onClick={onAddNote}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi Nota"
        >
          <FileTextIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Nota</span>
        </button>

        {/* Foto */}
        <button
          onClick={onAddPhoto}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi Foto"
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Foto</span>
        </button>

        {/* File */}
        <button
          onClick={onAddFile}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi File"
        >
          <FolderIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">File</span>
        </button>

        {/* Altro */}
        <button
          onClick={onMoreClick}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Altri box"
        >
          <MoreHorizontalIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Altro</span>
        </button>
      </div>
    </div>
  );
};

/**
 * MobileAddFab - Barra flottante per mobile
 * Design raffinato con tasti ben distinguibili
 *
 * @param {function} onAddNote - Handler per aggiungere una nota
 * @param {function} onAddPhoto - Handler per aggiungere una foto
 * @param {function} onAddFile - Handler per aggiungere un file
 * @param {function} onMoreClick - Handler per aprire il menu "Altro"
 */
export const MobileAddFab = ({
  onAddNote,
  onAddPhoto,
  onAddFile,
  onMoreClick,
}) => {
  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema del profilo
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Colore di sfondo della barra
  const bgColor = primaryColor;

  // Determina il colore del testo in base alla luminosità dello sfondo
  const isLight = isLightColor(primaryColor);

  // Colori per i tasti - design moderno con contrasto elevato
  const buttonBgColor = isDark
    ? "rgba(38, 38, 38, 0.95)" // Grigio scuro per tema dark
    : "rgba(255, 255, 255, 0.95)"; // Bianco per tema light

  const buttonTextColor = isDark
    ? "#e5e5e5" // Testo chiaro per tema dark
    : "#404040"; // Testo scuro per tema light

  const buttonHoverBg = isDark
    ? "rgba(50, 50, 50, 1)"
    : "rgba(245, 245, 245, 1)";

  const disabledBgColor = isDark
    ? "rgba(38, 38, 38, 0.4)"
    : "rgba(255, 255, 255, 0.4)";

  const disabledTextColor = isDark
    ? "rgba(229, 229, 229, 0.3)"
    : "rgba(64, 64, 64, 0.3)";

  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-3">
      <div
        className="rounded-2xl p-2 shadow-xl grid grid-cols-4 gap-2 w-full max-w-md"
        style={{
          backgroundColor: bgColor,
          boxShadow: `0 8px 32px ${primaryColor}40, 0 4px 12px rgba(0,0,0,0.15)`,
        }}
      >
        {/* Nota - attivo */}
        <button
          onClick={onAddNote}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi Nota"
        >
          <FileTextIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Nota</span>
        </button>

        {/* Foto - attivo */}
        <button
          onClick={onAddPhoto}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi Foto"
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Foto</span>
        </button>

        {/* File - attivo */}
        <button
          onClick={onAddFile}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Aggiungi File"
        >
          <FolderIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">File</span>
        </button>

        {/* Altro */}
        <button
          onClick={onMoreClick}
          className="
            flex flex-col items-center justify-center gap-1.5
            rounded-xl
            py-3 px-2
            transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98]
            shadow-sm
          "
          style={{
            backgroundColor: buttonBgColor,
            color: buttonTextColor,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = buttonHoverBg)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = buttonBgColor)
          }
          aria-label="Altri box"
        >
          <MoreHorizontalIcon className="w-6 h-6" />
          <span className="text-xs font-semibold tracking-wide">Altro</span>
        </button>
      </div>
    </div>
  );
};

export default AddBentoBoxButton;
