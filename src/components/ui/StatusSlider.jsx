import { useTheme } from "../../contexts/ThemeContext";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_ORDER,
} from "../../utils/projectStatuses";

/**
 * StatusSlider - Slider per selezionare lo stato di un progetto
 * Design con caselle contenenti icona e testo, collegate da una linea
 * - Barra grigia per stati non attivi
 * - Barra colorata con gradient fino allo stato attivo
 *
 * @param {string} value - Stato corrente selezionato
 * @param {function} onChange - Callback quando lo stato cambia
 */
const StatusSlider = ({ value, onChange }) => {
  const { isDark } = useTheme();

  // Trova l'indice dello stato corrente
  const currentIndex = PROJECT_STATUS_ORDER.indexOf(value);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;

  // Ottieni i colori di tutti gli stati per il gradient
  const getStatusColor = (statusId) => {
    const status = PROJECT_STATUSES[statusId];
    return isDark ? status.color.dark.bg : status.color.light.bg;
  };

  // Colore grigio per la barra inattiva
  const grayColor = isDark ? "#3f3f46" : "#d4d4d8";

  // Crea il gradient per la barra attiva (dal primo stato fino a quello corrente)
  const createActiveGradient = () => {
    if (safeIndex === 0) {
      return getStatusColor(PROJECT_STATUS_ORDER[0]);
    }
    const activeStatuses = PROJECT_STATUS_ORDER.slice(0, safeIndex + 1);
    const colors = activeStatuses.map((statusId) => getStatusColor(statusId));
    const stops = colors.map((color, index) => {
      const position = (index / (colors.length - 1)) * 100;
      return `${color} ${position}%`;
    });
    return `linear-gradient(to right, ${stops.join(", ")})`;
  };

  // Calcola la larghezza della barra attiva in percentuale
  const activeBarWidth = (safeIndex / (PROJECT_STATUS_ORDER.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Container con linea di connessione */}
      <div className="relative">
        {/* Linea grigia di sfondo (sempre visibile, collega tutti gli stati) */}
        <div
          className="absolute left-[12.5%] right-[12.5%] rounded-full"
          style={{
            backgroundColor: grayColor,
            height: "14px", // 1/3 del cerchio (40px / 3 ≈ 14px)
            top: "21px", // Centrato: py-2 (8px) + (40px - 14px) / 2 = 8 + 13 = 21px
          }}
        />

        {/* Linea colorata attiva (dal primo stato fino a quello corrente) */}
        <div
          className="absolute left-[12.5%] rounded-full transition-all duration-300"
          style={{
            background: createActiveGradient(),
            height: "14px",
            top: "21px",
            width: `${activeBarWidth * 0.75}%`, // 0.75 perché left-[12.5%] e right-[12.5%] = 75% totale
          }}
        />

        {/* Caselle degli stati */}
        <div className="relative flex justify-between">
          {PROJECT_STATUS_ORDER.map((statusId, index) => {
            const status = PROJECT_STATUSES[statusId];
            const StatusIcon = status.icon;
            const isActive = index <= safeIndex;
            const isCurrent = index === safeIndex;
            const statusColor = isDark
              ? status.color.dark.bg
              : status.color.light.bg;

            return (
              <button
                key={statusId}
                type="button"
                onClick={() => onChange(statusId)}
                className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl active:scale-95"
                style={{ width: "25%" }}
                aria-label={status.label}
                aria-pressed={isCurrent}
              >
                {/* Cerchio con icona */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      isCurrent
                        ? "ring-2 ring-offset-2 ring-offset-bg-secondary shadow-lg"
                        : ""
                    }
                  `}
                  style={{
                    backgroundColor: isActive
                      ? statusColor
                      : isDark
                      ? "#3f3f46"
                      : "#e4e4e7",
                    ringColor: isCurrent ? statusColor : "transparent",
                  }}
                >
                  <StatusIcon
                    className="w-5 h-5"
                    style={{
                      color: isActive
                        ? isDark && status.color.dark.text === "#000000"
                          ? "#000"
                          : "#fff"
                        : isDark
                        ? "#71717a"
                        : "#a1a1aa",
                    }}
                  />
                </div>

                {/* Label */}
                <span
                  className={`
                    text-[11px] font-medium text-center leading-tight
                    ${isCurrent ? "font-semibold" : ""}
                  `}
                  style={{
                    color: isCurrent
                      ? statusColor
                      : isActive
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {status.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusSlider;
