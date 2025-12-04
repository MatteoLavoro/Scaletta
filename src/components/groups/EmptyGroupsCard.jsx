import { UsersIcon, PlusIcon, UserPlusIcon } from "../icons";

/**
 * EmptyGroupsCard - Card tutorial che appare quando l'utente non ha gruppi
 * Contiene i tasti per creare o unirsi a un gruppo
 */
const EmptyGroupsCard = ({ onCreateGroup, onJoinGroup }) => {
  return (
    <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
      {/* Header con icona */}
      <div className="p-6 text-center border-b border-border">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <UsersIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Benvenuto in Scaletta!
        </h2>
        <p className="text-text-secondary text-sm">
          Non fai ancora parte di nessun gruppo.
        </p>
        <p className="text-text-muted text-sm mt-1">
          Crea un nuovo gruppo di lavoro o unisciti a uno esistente con un
          codice.
        </p>
      </div>

      {/* Tasti azione */}
      <div className="p-4 flex gap-3">
        <button
          onClick={onCreateGroup}
          className="
            flex-1 p-4
            flex items-center justify-center gap-2
            bg-primary/10 border border-primary/30 rounded-xl
            text-primary font-medium
            hover:bg-primary/20 hover:border-primary/50
            transition-all duration-200
            active:scale-[0.98]
          "
        >
          <PlusIcon className="w-5 h-5" />
          <span className="text-sm">Crea gruppo</span>
        </button>

        <button
          onClick={onJoinGroup}
          className="
            flex-1 p-4
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
      </div>
    </div>
  );
};

export default EmptyGroupsCard;
