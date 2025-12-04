import { UserPlusIcon } from "../icons";

/**
 * JoinGroupButton - Tasto rettangolare tratteggiato per unirsi a un gruppo
 */
const JoinGroupButton = ({ onClick }) => {
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
      <UserPlusIcon className="w-5 h-5" />
      <span className="text-sm font-medium">Unisciti</span>
    </button>
  );
};

export default JoinGroupButton;
