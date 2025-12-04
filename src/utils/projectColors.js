/**
 * PROJECT_COLORS - 14 colori per i progetti
 * Disposti in scala cromatica, con varianti light/dark
 *
 * Seguono le linee guida Material Design:
 * - Light mode: colori più saturi e scuri (tone 40-50)
 * - Dark mode: colori meno saturi e più chiari (tone 70-80)
 */
export const PROJECT_COLORS = {
  // Riga 1: Rossi -> Gialli -> Verdi (7 colori)
  red: {
    light: { bg: "#c62828", text: "#ffffff" },
    dark: { bg: "#ef5350", text: "#ffffff" },
  },
  deepOrange: {
    light: { bg: "#d84315", text: "#ffffff" },
    dark: { bg: "#ff7043", text: "#ffffff" },
  },
  orange: {
    light: { bg: "#ef6c00", text: "#ffffff" },
    dark: { bg: "#ffa726", text: "#1a1a1a" },
  },
  amber: {
    light: { bg: "#ff8f00", text: "#1a1a1a" },
    dark: { bg: "#ffca28", text: "#1a1a1a" },
  },
  yellow: {
    light: { bg: "#f9a825", text: "#1a1a1a" },
    dark: { bg: "#ffee58", text: "#1a1a1a" },
  },
  lime: {
    light: { bg: "#9e9d24", text: "#ffffff" },
    dark: { bg: "#d4e157", text: "#1a1a1a" },
  },
  lightGreen: {
    light: { bg: "#558b2f", text: "#ffffff" },
    dark: { bg: "#9ccc65", text: "#1a1a1a" },
  },
  // Riga 2: Verdi -> Blu -> Viola (7 colori)
  green: {
    light: { bg: "#2e7d32", text: "#ffffff" },
    dark: { bg: "#66bb6a", text: "#1a1a1a" },
  },
  teal: {
    light: { bg: "#00796b", text: "#ffffff" },
    dark: { bg: "#4db6ac", text: "#1a1a1a" },
  },
  cyan: {
    light: { bg: "#0097a7", text: "#ffffff" },
    dark: { bg: "#4dd0e1", text: "#1a1a1a" },
  },
  lightBlue: {
    light: { bg: "#0288d1", text: "#ffffff" },
    dark: { bg: "#4fc3f7", text: "#1a1a1a" },
  },
  blue: {
    light: { bg: "#1565c0", text: "#ffffff" },
    dark: { bg: "#42a5f5", text: "#ffffff" },
  },
  purple: {
    light: { bg: "#7b1fa2", text: "#ffffff" },
    dark: { bg: "#ba68c8", text: "#ffffff" },
  },
  pink: {
    light: { bg: "#c2185b", text: "#ffffff" },
    dark: { bg: "#f06292", text: "#ffffff" },
  },
};

// Array ordinato per il picker (2 righe x 7 colonne)
export const PROJECT_COLOR_ORDER = [
  // Prima riga
  ["red", "deepOrange", "orange", "amber", "yellow", "lime", "lightGreen"],
  // Seconda riga
  ["green", "teal", "cyan", "lightBlue", "blue", "purple", "pink"],
];

// Colore di default per nuovi progetti
export const DEFAULT_PROJECT_COLOR = "blue";

/**
 * Ottiene i colori per un progetto in base al tema
 * @param {string} colorId - ID del colore
 * @param {boolean} isDark - Se il tema è scuro
 * @returns {object} - { bg, text }
 */
export const getProjectColor = (colorId, isDark) => {
  const color =
    PROJECT_COLORS[colorId] || PROJECT_COLORS[DEFAULT_PROJECT_COLOR];
  return isDark ? color.dark : color.light;
};
