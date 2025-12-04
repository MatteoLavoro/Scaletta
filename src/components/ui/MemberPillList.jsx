import { CrownIcon, UserIcon } from "../icons";

/**
 * MemberPillList - Lista di pillole con i nomi dei membri
 *
 * @param {array} members - Lista dei membri [{ uid, displayName }]
 * @param {string} currentUserId - ID dell'utente corrente (pillola colorata)
 * @param {string} founderId - ID del fondatore (pillola con corona)
 * @param {string} color - Colore per la pillola dell'utente corrente
 */

const COLOR_MAP = {
  teal: {
    bg: "bg-teal-500/15 dark:bg-teal-500/20",
    border: "border-teal-600/30 dark:border-teal-500/40",
    text: "text-teal-700 dark:text-teal-300",
  },
  blue: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    border: "border-blue-600/30 dark:border-blue-500/40",
    text: "text-blue-700 dark:text-blue-300",
  },
  purple: {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    border: "border-purple-600/30 dark:border-purple-500/40",
    text: "text-purple-700 dark:text-purple-300",
  },
  red: {
    bg: "bg-red-500/15 dark:bg-red-500/20",
    border: "border-red-600/30 dark:border-red-500/40",
    text: "text-red-700 dark:text-red-300",
  },
  orange: {
    bg: "bg-orange-500/15 dark:bg-orange-500/20",
    border: "border-orange-600/30 dark:border-orange-500/40",
    text: "text-orange-700 dark:text-orange-300",
  },
  green: {
    bg: "bg-green-500/15 dark:bg-green-500/20",
    border: "border-green-600/30 dark:border-green-500/40",
    text: "text-green-700 dark:text-green-300",
  },
};

const FOUNDER_COLORS = {
  bg: "bg-amber-500/15 dark:bg-amber-500/20",
  border: "border-amber-600/30 dark:border-amber-500/40",
  text: "text-amber-700 dark:text-amber-300",
};

const DEFAULT_COLORS = {
  bg: "bg-gray-500/10 dark:bg-bg-tertiary",
  border: "border-gray-300 dark:border-border",
  text: "text-gray-600 dark:text-text-secondary",
};

const CURRENT_USER_INDICATOR = {
  bg: "bg-primary/15",
  border: "border-primary/40",
  text: "text-primary",
};

const MemberPillList = ({
  members = [],
  currentUserId,
  founderId,
  className = "",
}) => {
  // Ordina: prima l'utente corrente, poi il founder, poi gli altri
  const sortedMembers = [...members].sort((a, b) => {
    if (a.uid === currentUserId) return -1;
    if (b.uid === currentUserId) return 1;
    if (a.uid === founderId) return -1;
    if (b.uid === founderId) return 1;
    return 0;
  });

  const getPillColors = (member) => {
    const isCurrentUser = member.uid === currentUserId;
    const isFounder = member.uid === founderId;

    if (isCurrentUser) {
      return CURRENT_USER_INDICATOR;
    }
    if (isFounder) {
      return FOUNDER_COLORS;
    }
    return DEFAULT_COLORS;
  };

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {sortedMembers.map((member) => {
        const isFounder = member.uid === founderId;
        const isCurrentUser = member.uid === currentUserId;
        const colors = getPillColors(member);

        // Determina il testo da mostrare
        const getDisplayText = () => {
          if (isCurrentUser && isFounder) {
            return "Tu";
          }
          if (isCurrentUser) {
            return "Tu";
          }
          return member.displayName || "Utente";
        };

        // Determina i colori: founder ha sempre colori amber
        const pillColors = isFounder ? FOUNDER_COLORS : colors;

        return (
          <div
            key={member.uid}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1
              rounded-full border text-xs font-medium
              ${pillColors.bg} ${pillColors.border} ${pillColors.text}
              ${isCurrentUser && !isFounder ? "ring-2 ring-primary/30" : ""}
            `}
          >
            <CrownIcon className={`w-3 h-3 ${isFounder ? "" : "hidden"}`} />
            {isCurrentUser && !isFounder && <UserIcon className="w-3 h-3" />}
            <span>{getDisplayText()}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MemberPillList;
