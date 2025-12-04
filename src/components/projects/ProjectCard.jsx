import { useTheme } from "../../contexts/ThemeContext";
import {
  getProjectColor,
  DEFAULT_PROJECT_COLOR,
} from "../../utils/projectColors";

/**
 * ProjectCard - Quadrato cliccabile per un progetto
 * Sfondo colorato in base al colore del progetto, nome centrato, data in basso
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
        aspect-square min-w-0 flex flex-col items-center justify-center p-3
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
      {/* Nome progetto - centrato */}
      <span className="flex-1 flex items-center justify-center text-sm text-text-primary font-semibold text-center line-clamp-3 leading-tight px-1">
        {project.name}
      </span>

      {/* Data creazione - in basso */}
      <span className="text-[10px] text-text-secondary mt-1">
        {formatDate(project.createdAt)}
      </span>
    </button>
  );
};

export default ProjectCard;
