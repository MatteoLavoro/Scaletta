import { LinkIcon, FolderIcon } from "../icons";

/**
 * JoinSharedProjectButton - Tasto per aggiungere un progetto condiviso tramite codice
 */
const JoinSharedProjectButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="
        aspect-square min-w-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3
        border-2 border-dashed border-border rounded-xl
        text-text-secondary
        hover:border-primary hover:text-primary hover:bg-primary/5
        transition-all duration-200 active:scale-95
      "
    >
      <div className="relative flex items-center justify-center">
        <FolderIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 absolute -bottom-1 -right-1.5" />
      </div>
      <span className="text-[11px] sm:text-xs font-medium text-center leading-tight">
        Progetto condiviso
      </span>
    </button>
  );
};

export default JoinSharedProjectButton;
