import { useTheme } from "../../contexts/ThemeContext";
import {
  getProjectColor,
  DEFAULT_PROJECT_COLOR,
} from "../../utils/projectColors";
import {
  getProjectStatus,
  DEFAULT_PROJECT_STATUS,
} from "../../utils/projectStatuses";

/**
 * ProjectCard - Quadrato cliccabile per un progetto
 * Icona stato centrata (solo icona senza sfondo), nome sopra, data sotto
 *
 * @param {object} project - Dati del progetto
 * @param {function} onClick - Callback quando viene cliccato
 */
const ProjectCard = ({ project, onClick }) => {
  const { isDark } = useTheme();

  // Ottieni il colore del progetto
  const projectColor = getProjectColor(
    project?.color || DEFAULT_PROJECT_COLOR,
    isDark
  );

  // Ottieni lo stato del progetto
  const status = getProjectStatus(
    project?.status || DEFAULT_PROJECT_STATUS,
    isDark
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
      onClick={onClick}
      className="
        aspect-square min-w-0 w-full flex flex-col p-2.5
        rounded-xl
        transition-all duration-200 active:scale-95
      "
      style={{
        backgroundColor: `${projectColor.bg}20`,
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: `${projectColor.bg}50`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${projectColor.bg}35`;
        e.currentTarget.style.borderColor = `${projectColor.bg}70`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${projectColor.bg}20`;
        e.currentTarget.style.borderColor = `${projectColor.bg}50`;
      }}
    >
      {/* Nome progetto - in alto */}
      <span className="text-[11px] text-text-primary font-semibold text-center line-clamp-2 leading-tight">
        {project.name}
      </span>

      {/* Icona stato - centrata nella card */}
      <div className="flex-1 flex items-center justify-center">
        <StatusIcon className="w-7 h-7" style={{ color: status.bg }} />
      </div>

      {/* Data creazione - in basso */}
      <span className="text-[10px] text-text-secondary text-center">
        {formatDate(project.createdAt)}
      </span>
    </button>
  );
};

export default ProjectCard;
