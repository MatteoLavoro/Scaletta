/**
 * InfoBox - Contenitore informativo con stile
 * Riquadro colorato con titolo centrato e contenuto centrato
 *
 * @param {string} title - Titolo della box (centrato in alto)
 * @param {string} color - Colore di sfondo (es: "teal", "blue", "purple", "red", "orange", "green")
 * @param {React.ReactNode} children - Contenuto della box
 */

const COLOR_MAP = {
  teal: {
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    text: "text-teal-400",
  },
  blue: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  purple: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-400",
  },
  red: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
  },
  orange: {
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  green: {
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
  },
  gray: {
    bg: "bg-gray-500/15",
    border: "border-gray-500/30",
    text: "text-gray-400",
  },
};

const InfoBox = ({ title, color = "gray", children, className = "" }) => {
  const colors = COLOR_MAP[color] || COLOR_MAP.gray;

  return (
    <div
      className={`
        rounded-2xl border p-4
        ${colors.bg} ${colors.border}
        ${className}
      `}
    >
      {title && (
        <h3 className={`text-sm font-semibold text-center mb-3 ${colors.text}`}>
          {title}
        </h3>
      )}
      <div className="flex flex-col items-center justify-center text-center text-text-primary">
        {children}
      </div>
    </div>
  );
};

export default InfoBox;
