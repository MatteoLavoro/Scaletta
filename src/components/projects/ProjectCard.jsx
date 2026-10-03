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
        aspect-square min-w-0 w-full flex flex-col p-2
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
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1.5 overflow-hidden">
        {/* Icona progetto: +50% da sm in su (mobile invariato per non
            far crescere le card) — cerchietto 56→84px, icona 28→42px */}
        <div
          className="w-14 h-14 sm:w-[84px] sm:h-[84px] rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${projectColor.bg}30` }}
        >
          <ProjectIcon
            name={project?.icon}
            className="w-7 h-7 sm:w-[42px] sm:h-[42px]"
            style={{ color: projectColor.bg }}
          />
        </div>
        <span className="text-[11px] text-text-primary font-semibold text-center line-clamp-2 leading-tight">
          {project.name}
        </span>
      </div>

      {/* Riga inferiore: stato (sinistra, 2x) + pillole angolari impilate (destra) */}
      <div className="shrink-0 flex items-end justify-between gap-1">
        {/* Stato - riquadro grande il doppio delle pillole angolari */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: isPending ? "#f97316" : status.bg }}
          title={isPending ? "In attesa" : status.label}
        >
          {isPending ? (
            <ClockIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
          ) : (
            <StatusIcon className="w-5 h-5" style={{ color: status.text }} />
          )}
        </div>

        {/* Pillole angolari: notifiche / news / link, impilate una sopra l'altra */}
        <div className="flex flex-col-reverse items-end gap-1 shrink-0">
          {showNews && !isPending && (
            <div
              className="flex items-center justify-center w-5 h-5 rounded-md shadow-lg"
              style={{ backgroundColor: projectColor.bg }}
              title="Novità"
            >
              <ZapIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
          )}

          {unreadCount > 0 && !isPending && !isShared && (
            <div
              className="flex items-center justify-center gap-0.5 px-1 h-5 bg-red-500 rounded-md shadow-lg"
              title="Messaggi non letti"
            >
              <BellIcon className="w-3 h-3 text-white" strokeWidth={2.5} />
              {unreadCount > 1 && (
                <span className="text-[10px] font-bold text-white leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
          )}

          {isShared && !isPending && (
            <div
              className="flex items-center justify-center w-5 h-5 rounded-md shadow-lg"
              style={{ backgroundColor: projectColor.bg }}
              title="Progetto condiviso"
            >
              <LinkIcon className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ProjectCard;
