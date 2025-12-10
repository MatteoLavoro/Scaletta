import Modal from "./Modal";
import { ListChecksIcon } from "../icons";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * BoxOptionCard - Card per una singola opzione di box
 */
const BoxOptionCard = ({ icon, title, description, onClick, primaryColor }) => {
  return (
    <button
      onClick={onClick}
      className="
        w-full p-4
        flex items-center gap-4
        bg-bg-tertiary/50 hover:bg-bg-tertiary
        border border-border/50 hover:border-border
        rounded-xl
        transition-all duration-200
        text-left
        group
      "
    >
      {/* Icona */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors"
        style={{
          backgroundColor: `${primaryColor}15`,
          color: primaryColor,
        }}
      >
        {icon}
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
          {title}
        </p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
    </button>
  );
};

/**
 * MoreBoxesModal - Modale per selezionare altri tipi di box
 *
 * Mostra una lista di box meno comuni che l'utente può aggiungere.
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback per chiudere il modale
 * @param {function} onAddChecklist - Callback per aggiungere una checklist
 * @param {number} zIndex - z-index per modali annidati
 */
const MoreBoxesModal = ({ isOpen, onClose, onAddChecklist, zIndex }) => {
  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Handler per aggiungere checklist
  const handleAddChecklist = () => {
    onAddChecklist?.();
    onClose?.();
  };

  // Lista di opzioni box disponibili
  const boxOptions = [
    {
      id: "checklist",
      icon: <ListChecksIcon className="w-6 h-6" />,
      title: "Checklist",
      description: "Lista di cose da fare con checkbox",
      onClick: handleAddChecklist,
    },
    // Qui potrai aggiungere altri tipi di box in futuro
    // {
    //   id: "countdown",
    //   icon: <ClockIcon className="w-6 h-6" />,
    //   title: "Countdown",
    //   description: "Timer con conto alla rovescia",
    //   onClick: handleAddCountdown,
    // },
  ];

  return (
    <Modal
      isOpen={isOpen}
      title="Altri box"
      onClose={onClose}
      showConfirmButton={false}
      variant="info"
      zIndex={zIndex}
    >
      <div className="space-y-3">
        {boxOptions.map((option) => (
          <BoxOptionCard
            key={option.id}
            icon={option.icon}
            title={option.title}
            description={option.description}
            onClick={option.onClick}
            primaryColor={primaryColor}
          />
        ))}
      </div>

      {/* Info aggiuntiva */}
      <p className="text-xs text-text-muted text-center mt-4">
        Altri tipi di box saranno disponibili presto
      </p>
    </Modal>
  );
};

export default MoreBoxesModal;
