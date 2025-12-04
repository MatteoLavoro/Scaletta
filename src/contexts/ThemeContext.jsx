/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

/**
 * Sistema colori per tema chiaro/scuro
 *
 * I colori in modalità scura hanno:
 * - Saturazione leggermente ridotta (meno intensi)
 * - Luminosità aumentata (più chiari) per contrasto su sfondo scuro
 *
 * Questo riduce l'affaticamento visivo seguendo le linee guida Material Design:
 * - Light mode: colori più saturi e scuri (tone 40)
 * - Dark mode: colori meno saturi e più chiari (tone 80)
 */
const THEME_COLORS = {
  teal: {
    light: {
      primary: "#00796b",
      primaryLight: "#009688",
      primaryDark: "#004d40",
    },
    dark: {
      primary: "#00bcd4",
      primaryLight: "#4dd0e1",
      primaryDark: "#0097a7",
    },
  },
  blue: {
    light: {
      primary: "#1565c0",
      primaryLight: "#1976d2",
      primaryDark: "#0d47a1",
    },
    dark: {
      primary: "#42a5f5",
      primaryLight: "#64b5f6",
      primaryDark: "#1e88e5",
    },
  },
  purple: {
    light: {
      primary: "#7b1fa2",
      primaryLight: "#9c27b0",
      primaryDark: "#4a148c",
    },
    dark: {
      primary: "#ba68c8",
      primaryLight: "#ce93d8",
      primaryDark: "#9c27b0",
    },
  },
  red: {
    light: {
      primary: "#c62828",
      primaryLight: "#e53935",
      primaryDark: "#b71c1c",
    },
    dark: {
      primary: "#ef5350",
      primaryLight: "#e57373",
      primaryDark: "#d32f2f",
    },
  },
  orange: {
    light: {
      primary: "#ef6c00",
      primaryLight: "#f57c00",
      primaryDark: "#e65100",
    },
    dark: {
      primary: "#ffa726",
      primaryLight: "#ffb74d",
      primaryDark: "#fb8c00",
    },
  },
  green: {
    light: {
      primary: "#2e7d32",
      primaryLight: "#43a047",
      primaryDark: "#1b5e20",
    },
    dark: {
      primary: "#66bb6a",
      primaryLight: "#81c784",
      primaryDark: "#4caf50",
    },
  },
};

const THEME_BG = {
  light: {
    bgPrimary: "#fafafa",
    bgSecondary: "#ffffff",
    bgTertiary: "#f0f0f0",
    textPrimary: "#1a1a1a",
    textSecondary: "#525252",
    textMuted: "#737373",
    border: "#d4d4d4",
    divider: "#a3a3a3",
  },
  dark: {
    bgPrimary: "#121212",
    bgSecondary: "#1e1e1e",
    bgTertiary: "#2d2d2d",
    textPrimary: "#ffffff",
    textSecondary: "#b3b3b3",
    textMuted: "#666666",
    border: "#333333",
    divider: "#404040",
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accentColor") || "teal";
    }
    return "teal";
  });

  // Colore override per la status bar (es. dalla pagina progetto)
  const statusBarOverrideRef = useRef(null);
  const [, forceUpdate] = useState({});

  // Funzione per aggiornare il meta tag theme-color
  const updateThemeColorMeta = useCallback((color) => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.name = "theme-color";
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = color;
  }, []);

  // Funzione per impostare un colore override per la status bar
  const setStatusBarColor = useCallback(
    (color) => {
      statusBarOverrideRef.current = color;
      if (color) {
        updateThemeColorMeta(color);
      } else {
        // Ripristina il colore del tema
        const bg = THEME_BG[theme];
        updateThemeColorMeta(bg.bgPrimary);
      }
      forceUpdate({});
    },
    [theme, updateThemeColorMeta]
  );

  // Funzione per resettare il colore della status bar al default del tema
  const resetStatusBarColor = useCallback(() => {
    statusBarOverrideRef.current = null;
    const bg = THEME_BG[theme];
    updateThemeColorMeta(bg.bgPrimary);
    forceUpdate({});
  }, [theme, updateThemeColorMeta]);

  // Applica i colori al CSS
  useEffect(() => {
    const root = document.documentElement;
    const colors = THEME_COLORS[accentColor][theme];
    const bg = THEME_BG[theme];

    // Colori accent
    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-primary-light", colors.primaryLight);
    root.style.setProperty("--theme-primary-dark", colors.primaryDark);

    // Colori sfondo
    root.style.setProperty("--theme-bg-primary", bg.bgPrimary);
    root.style.setProperty("--theme-bg-secondary", bg.bgSecondary);
    root.style.setProperty("--theme-bg-tertiary", bg.bgTertiary);

    // Colori testo
    root.style.setProperty("--theme-text-primary", bg.textPrimary);
    root.style.setProperty("--theme-text-secondary", bg.textSecondary);
    root.style.setProperty("--theme-text-muted", bg.textMuted);

    // Bordi
    root.style.setProperty("--theme-border", bg.border);
    root.style.setProperty("--theme-divider", bg.divider);

    // Aggiorna theme-color meta tag (solo se non c'è un override attivo)
    if (!statusBarOverrideRef.current) {
      updateThemeColorMeta(bg.bgPrimary);
    }

    // Salva preferenze
    localStorage.setItem("theme", theme);
    localStorage.setItem("accentColor", accentColor);

    // Aggiorna classe body per eventuali stili aggiuntivi
    document.body.classList.toggle("light-theme", theme === "light");
  }, [theme, accentColor, updateThemeColorMeta]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    accentColor,
    setAccentColor,
    isDark: theme === "dark",
    colors: THEME_COLORS,
    setStatusBarColor,
    resetStatusBarColor,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export { THEME_COLORS, THEME_BG };
