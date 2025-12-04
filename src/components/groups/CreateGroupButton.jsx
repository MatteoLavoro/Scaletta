import { PlusIcon } from "../icons";

/**
 * CreateGroupButton - Tasto rettangolare tratteggiato per creare un gruppo
 */
const CreateGroupButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        flex-1 min-w-[140px] p-4
        flex items-center justify-center gap-2
        border-2 border-dashed border-border rounded-xl
        text-text-secondary
        hover:border-primary hover:text-primary hover:bg-primary/5
        transition-all duration-200
        active:scale-[0.98]
      "
    >
      <PlusIcon className="w-5 h-5" />
      <span className="text-sm font-medium">Crea gruppo</span>
    </button>
  );
};

export default CreateGroupButton;
