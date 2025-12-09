import { useState, useEffect } from "react";
import { InfoIcon, ChevronDownIcon, UsersIcon } from "../icons";
import GroupInfoModal from "./GroupInfoModal";
import { ProjectGrid } from "../projects";
import { Badge } from "../ui";

// Chiave localStorage per lo stato di espansione dei gruppi
const EXPANDED_GROUPS_KEY = "scaletta_expanded_groups";

// Funzioni helper per localStorage
const getExpandedGroups = () => {
  try {
    const stored = localStorage.getItem(EXPANDED_GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveExpandedGroups = (groupIds) => {
  try {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify(groupIds));
  } catch {
    // Ignora errori localStorage
  }
};

/**
 * GroupCard - Card espandibile per un gruppo
 *
 * @param {object} group - Dati del gruppo
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {object} currentUser - Oggetto utente corrente { uid, displayName, email }
 * @param {function} onProjectClick - Callback quando un progetto viene cliccato
 */
const GroupCard = ({ group, currentUserId, currentUser, onProjectClick }) => {
  // Inizializza lo stato di espansione da localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const expandedGroups = getExpandedGroups();
    return expandedGroups.includes(group.id);
  });
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [projectCount, setProjectCount] = useState(null);

  // Callback per aggiornare il conteggio progetti (chiamato da ProjectGrid)
  const handleProjectCountChange = (count) => {
    setProjectCount(count);
  };

  // Salva lo stato di espansione in localStorage quando cambia
  useEffect(() => {
    const expandedGroups = getExpandedGroups();
    const isCurrentlyStored = expandedGroups.includes(group.id);

    if (isExpanded && !isCurrentlyStored) {
      // Aggiungi all'array
      saveExpandedGroups([...expandedGroups, group.id]);
    } else if (!isExpanded && isCurrentlyStored) {
      // Rimuovi dall'array
      saveExpandedGroups(expandedGroups.filter((id) => id !== group.id));
    }
  }, [isExpanded, group.id]);

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
              <UsersIcon className="w-3.5 h-3.5" />
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
            <ChevronDownIcon className="w-5 h-5" />
          </div>

          {/* Badge contatore progetti + Tasto info - a destra */}
          <div className="flex items-center gap-2">
            {projectCount !== null && (
              <Badge
                count={projectCount}
                label={projectCount === 1 ? "Progetto" : "Progetti"}
              />
            )}
            <button
              onClick={handleInfoClick}
              className="p-2 rounded-lg bg-bg-tertiary hover:bg-divider text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Informazioni gruppo"
            >
              <InfoIcon className="w-5 h-5" />
            </button>
          </div>
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
              <div className="pt-4">
                <ProjectGrid
                  groupId={group.id}
                  group={group}
                  currentUser={currentUser}
                  onProjectClick={onProjectClick}
                  onProjectCountChange={handleProjectCountChange}
                />
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
      />
    </>
  );
};

export default GroupCard;
