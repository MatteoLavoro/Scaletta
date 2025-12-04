import { Check } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { PROJECT_COLORS, PROJECT_COLOR_ORDER } from "../../utils/projectColors";

/**
 * ProjectColorPicker - Selettore colore per progetti
 * 14 colori disposti su 2 righe x 7 colonne
 *
 * @param {string} value - Colore selezionato
 * @param {function} onChange - Callback quando il colore cambia
 */
const ProjectColorPicker = ({ value, onChange }) => {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col gap-2">
      {PROJECT_COLOR_ORDER.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center justify-between gap-1.5"
        >
          {row.map((colorId) => {
            const colorData = PROJECT_COLORS[colorId];
            const displayColor = isDark ? colorData.dark : colorData.light;
            const isSelected = value === colorId;

            return (
              <button
                key={colorId}
                type="button"
                onClick={() => onChange(colorId)}
                className={`
                  relative w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shrink-0
                  ${
                    isSelected
                      ? "ring-2 ring-offset-2 ring-offset-bg-secondary ring-text-primary scale-110"
                      : "hover:scale-105"
                  }
                `}
                style={{ backgroundColor: displayColor.bg }}
                aria-label={colorId}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <Check
                    className="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5"
                    style={{ color: displayColor.text }}
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ProjectColorPicker;
