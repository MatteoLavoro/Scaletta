import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * ThemeSwitcher - Toggle tra tema chiaro e scuro
 */
const ThemeSwitcher = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10
        rounded-full transition-all duration-200
        ${
          isDark
            ? "bg-bg-tertiary text-yellow-400 hover:bg-divider"
            : "bg-bg-tertiary text-blue-500 hover:bg-divider"
        }
        ${className}
      `}
      aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeSwitcher;
