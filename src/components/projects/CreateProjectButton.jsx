import { PlusIcon } from "../icons";

/**
 * CreateProjectButton - Tasto quadrato tratteggiato per creare un nuovo progetto
 * Stile simile a CreateGroupButton, stesse dimensioni di ProjectCard
 *
 * @param {function} onClick - Callback quando viene cliccato
 */
const CreateProjectButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        aspect-square min-w-0 flex flex-col items-center justify-center gap-2 p-3
        border-2 border-dashed border-border rounded-xl
        text-text-secondary
        hover:border-primary hover:text-primary hover:bg-primary/5
        transition-all duration-200 active:scale-95
      "
    >
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs font-medium text-center leading-tight">
        Nuovo progetto
      </span>
    </button>
  );
};

export default CreateProjectButton;
