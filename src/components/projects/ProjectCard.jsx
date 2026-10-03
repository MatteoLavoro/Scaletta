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
import { ProjectIcon } from "../ui";

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

  return (
    <button
      onClick={isPending ? undefined : onClick}
      disabled={isPending}
      className={`
        aspect-square min-w-0 w-full flex flex-col p-1.5 min-[480px]:p-2
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
      {/* Contenuto centrale: icona progetto in cerchietto + nome */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 sm:gap-1.5 overflow-hidden">
        {/* Icona progetto: cerchio e icona scalano con la larghezza della card
            (56px su telefoni a 2 colonne, 48px nelle fasce a 3 colonne,
            84px su desktop) così icona e nome restano sempre visibili e
            non vengono mai tagliati dall'overflow della card */}
        <div
          className="w-14 h-14 min-[480px]:w-12 min-[480px]:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[84px] lg:h-[84px] rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${projectColor.bg}30` }}
        >
          <ProjectIcon
            name={project?.icon}
            className="w-7 h-7 min-[480px]:w-6 min-[480px]:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-[42px] lg:h-[42px]"
            style={{ color: projectColor.bg }}
          />
        </div>
        {/* Nome: 12px sui telefoni (card più larghe a 2 colonne), 11px nelle
            fasce a 3/4 colonne dove la card è più stretta */}
        <span className="w-full text-xs min-[480px]:text-[11px] sm:text-[11px] md:text-xs text-text-primary font-semibold text-center line-clamp-2 leading-tight break-words">
          {project.name}
        </span>
      </div>

      {/* Riga inferiore: stato (sinistra, 2x) + pillole angolari impilate (destra) */}
      <div className="shrink-0 flex items-end justify-between gap-1">
        {/* Stato - riquadro grande il doppio delle pillole angolari */}
        <div
          className="w-7 h-7 min-[480px]:w-6 min-[480px]:h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 rounded-md lg:rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: isPending ? "#f97316" : status.bg }}
          title={isPending ? "In attesa" : status.label}
        >
          {isPending ? (
            <ClockIcon
              className="w-4 h-4 min-[480px]:w-3.5 min-[480px]:h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white"
              strokeWidth={2.5}
            />
          ) : (
            <StatusIcon
              className="w-4 h-4 min-[480px]:w-3.5 min-[480px]:h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5"
              style={{ color: status.text }}
            />
          )}
        </div>

        {/* Pillole angolari: notifiche / news / link, impilate una sopra l'altra
            (compatte su telefono così la colonna non supera lo stato) */}
        <div className="flex flex-col-reverse items-end gap-0.5 sm:gap-1 shrink-0">
          {showNews && !isPending && (
            <div
              className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-md shadow-lg"
              style={{ backgroundColor: projectColor.bg }}
              title="Novità"
            >
              <ZapIcon
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                strokeWidth={2.5}
              />
            </div>
          )}

          {unreadCount > 0 && !isPending && !isShared && (
            <div
              className="flex items-center justify-center gap-0.5 px-1 h-4 sm:h-5 bg-red-500 rounded-md shadow-lg"
              title="Messaggi non letti"
            >
              <BellIcon
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
                strokeWidth={2.5}
              />
              {unreadCount > 1 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          )}

          {isShared && !isPending && (
            <div
              className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-md shadow-lg"
              style={{ backgroundColor: projectColor.bg }}
              title="Progetto condiviso"
            >
              <LinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ProjectCard;
