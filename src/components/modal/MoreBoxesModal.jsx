import Modal from "./Modal";
import { ListChecksIcon, UserIcon, FileTextIcon } from "../icons";
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
 * @param {function} onAddAnagrafica - Callback per aggiungere una anagrafica
 * @param {function} onAddPdf - Callback per aggiungere un PDF box
 * @param {number} zIndex - z-index per modali annidati
 */
const MoreBoxesModal = ({
  isOpen,
  onClose,
  onAddChecklist,
  onAddAnagrafica,
  onAddPdf,
  zIndex,
}) => {
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

  // Handler per aggiungere anagrafica
  const handleAddAnagrafica = () => {
    onAddAnagrafica?.();
    onClose?.();
  };

  // Handler per aggiungere PDF
  const handleAddPdf = () => {
    onAddPdf?.();
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
    {
      id: "anagrafica",
      icon: <UserIcon className="w-6 h-6" />,
      title: "Anagrafica",
      description: "Dati cliente: nome, luogo, email, telefono...",
      onClick: handleAddAnagrafica,
    },
    {
      id: "pdf",
      icon: <FileTextIcon className="w-6 h-6" />,
      title: "PDF",
      description: "Documenti PDF con anteprima prima pagina",
      onClick: handleAddPdf,
    },
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
    </Modal>
  );
};

export default MoreBoxesModal;
