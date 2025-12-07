import { PlusIcon, FileTextIcon } from "../icons";

/**
 * BoxTypeButton - Singolo tasto per tipo di box
 */
const BoxTypeButton = ({ icon: Icon, label, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center gap-1
      border-2 border-dashed border-border rounded-lg
      p-2
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
      <Icon className="w-5 h-5" />
    ) : (
      <PlusIcon className="w-5 h-5 opacity-30" />
    )}
    {label && (
      <span className="text-[10px] font-medium truncate w-full text-center">
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
        border-2 border-dashed border-border
        rounded-xl
        p-3
        grid grid-cols-2 gap-2
        ${className}
      `}
    >
      <BoxTypeButton icon={FileTextIcon} label="Nota" onClick={onAddNote} />
      <BoxTypeButton icon={null} label="" disabled />
      <BoxTypeButton icon={null} label="" disabled />
      <BoxTypeButton icon={null} label="" disabled />
    </div>
  );
};

/**
 * MobileAddFab - FAB flottante per mobile
 */
export const MobileAddFab = ({ onAddNote }) => (
  <div className="fixed bottom-4 left-4 right-4 z-40">
    <div
      className="
      bg-bg-secondary 
      border-2 border-dashed border-border 
      rounded-2xl 
      p-3
      shadow-lg
      grid grid-cols-4 gap-2
    "
    >
      <BoxTypeButton icon={FileTextIcon} label="Nota" onClick={onAddNote} />
      <BoxTypeButton icon={null} label="" disabled />
      <BoxTypeButton icon={null} label="" disabled />
      <BoxTypeButton icon={null} label="" disabled />
    </div>
  </div>
);

export default AddBentoBoxButton;
