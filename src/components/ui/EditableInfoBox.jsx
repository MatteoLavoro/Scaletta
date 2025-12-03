import { Pencil } from "lucide-react";

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
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    text: "text-teal-400",
    btn: "hover:bg-teal-500/25 bg-teal-500/10",
  },
  blue: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
    btn: "hover:bg-blue-500/25 bg-blue-500/10",
  },
  purple: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-400",
    btn: "hover:bg-purple-500/25 bg-purple-500/10",
  },
  red: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
    btn: "hover:bg-red-500/25 bg-red-500/10",
  },
  orange: {
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
    btn: "hover:bg-orange-500/25 bg-orange-500/10",
  },
  green: {
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
    btn: "hover:bg-green-500/25 bg-green-500/10",
  },
  gray: {
    bg: "bg-gray-500/15",
    border: "border-gray-500/30",
    text: "text-gray-400",
    btn: "hover:bg-gray-500/25 bg-gray-500/10",
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
        rounded-2xl border p-4 relative
        ${colors.bg} ${colors.border}
        ${className}
      `}
    >
      {title && (
        <h3 className={`text-sm font-semibold text-center mb-3 ${colors.text}`}>
          {title}
        </h3>
      )}
      {/* Container con tasto assoluto per non influenzare il centramento del testo */}
      <div className="relative">
        {/* Testo centrato */}
        <div className="text-text-primary text-center px-12">
          {value || <span className="text-text-muted">Non impostato</span>}
        </div>
        {/* Tasto modifica - posizionato a destra, centrato verticalmente */}
        <button
          onClick={onEdit}
          className={`
            absolute right-0 top-1/2 -translate-y-1/2
            p-3 rounded-xl transition-colors
            ${colors.btn} ${colors.text}
          `}
          aria-label={`Modifica ${title}`}
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default EditableInfoBox;
