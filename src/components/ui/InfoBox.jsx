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
    bg: "bg-teal-500/10 dark:bg-teal-500/15",
    border: "border-teal-600/25 dark:border-teal-500/30",
    text: "text-teal-700 dark:text-teal-400",
  },
  blue: {
    bg: "bg-blue-500/10 dark:bg-blue-500/15",
    border: "border-blue-600/25 dark:border-blue-500/30",
    text: "text-blue-700 dark:text-blue-400",
  },
  purple: {
    bg: "bg-purple-500/10 dark:bg-purple-500/15",
    border: "border-purple-600/25 dark:border-purple-500/30",
    text: "text-purple-700 dark:text-purple-400",
  },
  red: {
    bg: "bg-red-500/10 dark:bg-red-500/15",
    border: "border-red-600/25 dark:border-red-500/30",
    text: "text-red-700 dark:text-red-400",
  },
  orange: {
    bg: "bg-orange-500/10 dark:bg-orange-500/15",
    border: "border-orange-600/25 dark:border-orange-500/30",
    text: "text-orange-700 dark:text-orange-400",
  },
  green: {
    bg: "bg-green-500/10 dark:bg-green-500/15",
    border: "border-green-600/25 dark:border-green-500/30",
    text: "text-green-700 dark:text-green-400",
  },
  gray: {
    bg: "bg-gray-500/10 dark:bg-gray-500/15",
    border: "border-gray-600/25 dark:border-gray-500/30",
    text: "text-gray-700 dark:text-gray-400",
  },
};

const InfoBox = ({
  title,
  color = "gray",
  children,
  className = "",
  titleExtra,
}) => {
  const colors = COLOR_MAP[color] || COLOR_MAP.gray;

  return (
    <div
      className={`
        rounded-xl border px-4 py-3
        ${colors.bg} ${colors.border}
        ${className}
      `}
    >
      {title && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3
            className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}
          >
            {title}
          </h3>
          {titleExtra && (
            <span className={`text-xs font-medium ${colors.text} opacity-70`}>
              {titleExtra}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-col items-center justify-center text-center text-text-primary">
        {children}
      </div>
    </div>
  );
};

export default InfoBox;
