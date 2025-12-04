import { PencilIcon } from "../icons";

/**
 * EditableInfoBox - Contenitore informativo modificabile
 * Come InfoBox ma con tasto matita a destra per aprire modifica
 *
 * @param {string} title - Titolo della box (centrato in alto)
 * @param {string} value - Valore da mostrare
 * @param {string} color - Colore di sfondo
 * @param {function} onEdit - Callback quando si clicca sulla matita
 */

const COLOR_MAP = {
  teal: {
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    border: "border-teal-600/25 dark:border-teal-500/30",
    text: "text-teal-700 dark:text-teal-400",
    btn: "hover:bg-teal-500/20 dark:hover:bg-teal-500/25 bg-teal-500/10",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-600/25 dark:border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
    btn: "hover:bg-blue-500/20 dark:hover:bg-blue-500/25 bg-blue-500/10",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-600/25 dark:border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
    btn: "hover:bg-purple-500/20 dark:hover:bg-purple-500/25 bg-purple-500/10",
  },
  red: {
    bg: "bg-red-500/10 dark:bg-red-500/15",
    border: "border-red-600/25 dark:border-red-500/30",
    text: "text-red-700 dark:text-red-400",
    btn: "hover:bg-red-500/20 dark:hover:bg-red-500/25 bg-red-500/10",
  },
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/15",
    border: "border-orange-600/25 dark:border-orange-500/30",
    text: "text-orange-700 dark:text-orange-400",
    btn: "hover:bg-orange-500/20 dark:hover:bg-orange-500/25 bg-orange-500/10",
  },
  green: {
    bg: "bg-green-500/10 dark:bg-green-500/15",
    border: "border-green-600/25 dark:border-green-500/30",
    text: "text-green-700 dark:text-green-400",
    btn: "hover:bg-green-500/20 dark:hover:bg-green-500/25 bg-green-500/10",
  },
  gray: {
    bg: "bg-gray-500/10 dark:bg-gray-500/15",
    border: "border-gray-600/25 dark:border-gray-500/30",
    text: "text-gray-700 dark:text-gray-400",
    btn: "hover:bg-gray-500/20 dark:hover:bg-gray-500/25 bg-gray-500/10",
  },
};

const EditableInfoBox = ({
  title,
  value,
  color = "gray",
  onEdit,
  className = "",
}) => {
  const colors = COLOR_MAP[color] || COLOR_MAP.gray;

  return (
    <div
      className={`
        rounded-xl border px-4 py-3 relative
        ${colors.bg} ${colors.border}
        ${className}
      `}
    >
      {/* Contenuto centrato - indipendente dal tasto */}
      <div className="text-center">
        {title && (
          <h3
            className={`text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text}`}
          >
            {title}
          </h3>
        )}
        <div className="text-text-primary text-sm">
          {value || <span className="text-text-muted">Non impostato</span>}
        </div>
      </div>
      {/* Tasto modifica - posizionato a destra, centrato verticalmente */}
      <button
        onClick={onEdit}
        className={`
          absolute right-3 top-1/2 -translate-y-1/2
          p-2.5 rounded-lg transition-colors shrink-0
          ${colors.btn} ${colors.text}
        `}
        aria-label={`Modifica ${title}`}
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EditableInfoBox;
