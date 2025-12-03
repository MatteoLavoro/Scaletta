import { useState } from "react";
import { Info, ChevronDown, Users } from "lucide-react";
import GroupInfoModal from "./GroupInfoModal";

/**
 * GroupCard - Card espandibile per un gruppo
 *
 * @param {object} group - Dati del gruppo
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {function} onGroupUpdated - Callback quando il gruppo viene aggiornato
 * @param {function} onGroupLeft - Callback quando l'utente esce dal gruppo
 */
const GroupCard = ({ group, currentUserId, onGroupUpdated, onGroupLeft }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const memberCount = group.members?.length || 0;
  const isFounder = group.founderId === currentUserId;

  const handleInfoClick = (e) => {
    e.stopPropagation();
    setIsInfoOpen(true);
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden transition-all duration-300">
        {/* Header della card - sempre visibile */}
        <div
          onClick={handleCardClick}
          className="relative flex items-center p-4 cursor-pointer hover:bg-bg-tertiary/50 transition-colors active:scale-[0.99] active:bg-bg-tertiary/70"
        >
          {/* Info gruppo a sinistra */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">
              {group.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-text-secondary mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {memberCount} {memberCount === 1 ? "membro" : "membri"}
              </span>
            </div>
          </div>

          {/* Indicatore espansione - centrato orizzontalmente nella card */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 p-2 text-text-muted transition-transform duration-300 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
          >
            <ChevronDown className="w-5 h-5" />
          </div>

          {/* Tasto info - a destra */}
          <button
            onClick={handleInfoClick}
            className="p-2 rounded-lg bg-bg-tertiary hover:bg-divider text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Informazioni gruppo"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto espandibile con animazione */}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isExpanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <div className="pt-4 text-text-secondary text-sm">
                <p>Contenuto del gruppo in costruzione...</p>
                <p className="mt-2 text-text-muted">
                  Qui verranno mostrati i progetti del gruppo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modale info gruppo */}
      <GroupInfoModal
        isOpen={isInfoOpen}
        group={group}
        currentUserId={currentUserId}
        isFounder={isFounder}
        onClose={() => setIsInfoOpen(false)}
        onGroupUpdated={onGroupUpdated}
        onGroupLeft={onGroupLeft}
      />
    </>
  );
};

export default GroupCard;
