import { useState, useEffect, useRef } from "react";
import { CheckIcon } from "../icons";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * ColorPicker - Selettore colore principale
 * Mostra 6 colori tra cui scegliere
 * Animazione ottimistica: mostra subito il cambio visivo
 */

const COLOR_OPTIONS = [
  { id: "teal", label: "Verde Acqua", light: "#00796b", dark: "#00bcd4" },
  { id: "blue", label: "Blu", light: "#1565c0", dark: "#42a5f5" },
  { id: "purple", label: "Viola", light: "#7b1fa2", dark: "#ba68c8" },
  { id: "red", label: "Rosso", light: "#c62828", dark: "#ef5350" },
  { id: "orange", label: "Arancione", light: "#ef6c00", dark: "#ffa726" },
  { id: "green", label: "Verde", light: "#2e7d32", dark: "#66bb6a" },
];

const ColorPicker = ({ className = "" }) => {
  const { accentColor, setAccentColor, theme } = useTheme();
  // Stato locale ottimistico per animazione immediata
  const [optimisticColor, setOptimisticColor] = useState(accentColor);
  const pendingChangeRef = useRef(false);

  // Sincronizza con il valore reale dal context
  useEffect(() => {
    if (!pendingChangeRef.current) {
      setOptimisticColor(accentColor);
    }
  }, [accentColor]);

  const handleColorClick = (colorId) => {
    if (colorId === optimisticColor) return;

    // Aggiorna subito l'UI (ottimistico)
    setOptimisticColor(colorId);
    pendingChangeRef.current = true;

    // Applica il cambio (sincrono per il tema, ma l'animazione è già visibile)
    setAccentColor(colorId);
    pendingChangeRef.current = false;
  };

  return (
    <div
      className={`flex items-center justify-between gap-1.5 sm:gap-2 ${className}`}
    >
      {COLOR_OPTIONS.map((color) => {
        const isSelected = optimisticColor === color.id;
        const displayColor = theme === "dark" ? color.dark : color.light;

        return (
          <button
            key={color.id}
            onClick={() => handleColorClick(color.id)}
            className={`
              relative w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 shrink-0
              ${
                isSelected
                  ? "ring-2 ring-offset-2 ring-offset-bg-secondary ring-text-primary scale-110"
                  : "hover:scale-105"
              }
            `}
            style={{ backgroundColor: displayColor }}
            aria-label={color.label}
            aria-pressed={isSelected}
          >
            {isSelected && (
              <CheckIcon
                className="absolute inset-0 m-auto w-4 h-4 sm:w-5 sm:h-5"
                style={{
                  color: color.id === "gold" ? "#000" : "#fff",
                }}
                strokeWidth={3}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ColorPicker;
