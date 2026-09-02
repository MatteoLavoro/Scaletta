import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import {
  getProjectColor,
  DEFAULT_PROJECT_COLOR,
} from "../../utils/projectColors";
import {
  getProjectStatus,
  DEFAULT_PROJECT_STATUS,
} from "../../utils/projectStatuses";
import { subscribeToUnreadCount } from "../../services/notifications";
import { hasProjectNews } from "../../utils/projectViews";
import { ZapIcon, BellIcon, LinkIcon, ClockIcon } from "../icons";

/**
 * ProjectCard - Quadrato cliccabile per un progetto
 *
 * @param {object} project - Dati del progetto
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {function} onClick - Callback quando viene cliccato
 * @param {boolean} isShared - Se il progetto è condiviso (non appartiene al gruppo corrente)
 * @param {string} sharedRole - Ruolo del gruppo corrente ("pending"|"viewer"|"editor")
 */
const ProjectCard = ({
  project,
  currentUserId,
  onClick,
  isShared = false,
  sharedRole = null,
}) => {
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNews, setShowNews] = useState(false);

  const isPending = isShared && sharedRole === "pending";

  // Sottoscrizione notifiche non lette (solo se non pending)
  useEffect(() => {
    if (!project?.id || !currentUserId || isPending) return;

    const unsubscribe = subscribeToUnreadCount(
      project.id,
      currentUserId,
      (count) => {
        setUnreadCount(count);
      },
    );

    return () => unsubscribe();
  }, [project?.id, currentUserId, isPending]);

  // Controlla se ci sono news (attività recenti)
  useEffect(() => {
    if (!project || !currentUserId || isPending) return;
    setShowNews(hasProjectNews(project, currentUserId));
  }, [project, currentUserId, isPending]);

  // Ottieni il colore del progetto
  const projectColor = getProjectColor(
    project?.color || DEFAULT_PROJECT_COLOR,
    isDark,
  );

  // Ottieni lo stato del progetto
  const status = getProjectStatus(
    project?.status || DEFAULT_PROJECT_STATUS,
    isDark,
  );
  const StatusIcon = status.icon;

  // Formatta la data di creazione in formato gg/mm/aa
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  return (
    <button
      onClick={isPending ? undefined : onClick}
      disabled={isPending}
      className={`
        aspect-square min-w-0 w-full flex flex-col p-2.5
        rounded-xl relative
        transition-all duration-200
        ${isPending ? "cursor-default opacity-70" : "active:scale-95"}
      `}
      style={{
        backgroundColor: `${projectColor.bg}20`,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `${projectColor.bg}50`,
      }}
      onMouseEnter={(e) => {
        if (isPending) return;
        e.currentTarget.style.backgroundColor = `${projectColor.bg}35`;
        e.currentTarget.style.borderColor = `${projectColor.bg}70`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${projectColor.bg}20`;
        e.currentTarget.style.borderColor = `${projectColor.bg}50`;
      }}
    >
      {/* Badge News - in alto a sinistra */}
      {showNews && !isPending && (
        <div
          className="absolute top-1.5 left-1.5 flex items-center justify-center w-5 h-5 rounded-md shadow-lg"
          style={{ backgroundColor: projectColor.bg }}
        >
          <ZapIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* Badge Notifiche - in alto a destra */}
      {unreadCount > 0 && !isPending && !isShared && (
        <div className="absolute top-1.5 right-1.5 flex items-center justify-center gap-1 px-1.5 h-5 bg-red-500 rounded-md shadow-lg">
          <BellIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
          {unreadCount > 1 && (
            <span className="text-[10px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </div>
      )}

      {/* Badge Condiviso (catena) - in alto a destra per viewer/editor */}
      {isShared && !isPending && (
        <div
          className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-md shadow-lg"
          style={{ backgroundColor: projectColor.bg }}
        >
          <LinkIcon className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Badge In attesa - in alto a destra per pending */}
      {isPending && (
        <div className="absolute top-1.5 right-1.5 flex items-center justify-center w-5 h-5 rounded-md bg-orange-500 shadow-lg">
          <ClockIcon className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Nome progetto - in alto */}
      <span className="text-[11px] text-text-primary font-semibold text-center line-clamp-2 leading-tight">
        {project.name}
      </span>

      {/* Icona: orologio se pending, altrimenti icona stato */}
      <div className="flex-1 flex items-center justify-center">
        {isPending ? (
          <ClockIcon className="w-7 h-7 text-orange-500" />
        ) : (
          <StatusIcon className="w-7 h-7" style={{ color: status.bg }} />
        )}
      </div>

      {/* Data creazione - in basso */}
      <span className="text-[10px] text-text-secondary text-center">
        {isPending ? "In attesa" : formatDate(project.createdAt)}
      </span>
    </button>
  );
};

export default ProjectCard;
