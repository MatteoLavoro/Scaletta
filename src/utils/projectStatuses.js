import {
  PlayIcon,
  CheckCircleIcon,
  ArchiveIcon,
  TrashIcon,
} from "../components/icons";

/**
 * Stati disponibili per i progetti
 * Ogni stato ha un id, label, icona e colore
 */
export const PROJECT_STATUSES = {
  "in-corso": {
    id: "in-corso",
    label: "In corso",
    icon: PlayIcon,
    // Verde per in corso
    color: {
      light: { bg: "#22c55e", text: "#ffffff" },
      dark: { bg: "#4ade80", text: "#000000" },
    },
  },
  completato: {
    id: "completato",
    label: "Completato",
    icon: CheckCircleIcon,
    // Blu per completato
    color: {
      light: { bg: "#3b82f6", text: "#ffffff" },
      dark: { bg: "#60a5fa", text: "#000000" },
    },
  },
  archiviato: {
    id: "archiviato",
    label: "Archiviato",
    icon: ArchiveIcon,
    // Viola per archiviato
    color: {
      light: { bg: "#8b5cf6", text: "#ffffff" },
      dark: { bg: "#a78bfa", text: "#000000" },
    },
  },
  cestinato: {
    id: "cestinato",
    label: "Cestinato",
    icon: TrashIcon,
    // Rosso per cestinato
    color: {
      light: { bg: "#ef4444", text: "#ffffff" },
      dark: { bg: "#f87171", text: "#000000" },
    },
  },
};

// Stato di default per nuovi progetti
export const DEFAULT_PROJECT_STATUS = "in-corso";

// Ordine degli stati per visualizzazione
export const PROJECT_STATUS_ORDER = [
  "in-corso",
  "completato",
  "archiviato",
  "cestinato",
];

/**
 * Ottiene i dati di uno stato
 * @param {string} statusId - ID dello stato
 * @param {boolean} isDark - Se il tema è scuro
 * @returns {object} - Dati dello stato con colori corretti per il tema
 */
export const getProjectStatus = (statusId, isDark = false) => {
  const status =
    PROJECT_STATUSES[statusId] || PROJECT_STATUSES[DEFAULT_PROJECT_STATUS];
  const themeColors = isDark ? status.color.dark : status.color.light;

  return {
    ...status,
    bg: themeColors.bg,
    text: themeColors.text,
  };
};

/**
 * Ritorna le azioni disponibili per uno stato
 * @param {string} currentStatus - Stato corrente del progetto
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @returns {array} - Array di azioni disponibili
 */
export const getStatusActions = (currentStatus, isFounder = false) => {
  const actions = [];

  switch (currentStatus) {
    case "in-corso":
      actions.push({
        targetStatus: "completato",
        label: "Segna come completato",
        icon: CheckCircleIcon,
        variant: "success",
      });
      break;

    case "completato":
      actions.push({
        targetStatus: "in-corso",
        label: "Riporta in corso",
        icon: PlayIcon,
        variant: "default",
      });
      actions.push({
        targetStatus: "archiviato",
        label: "Archivia",
        icon: ArchiveIcon,
        variant: "muted",
      });
      break;

    case "archiviato":
      actions.push({
        targetStatus: "completato",
        label: "Disarchivia",
        icon: CheckCircleIcon,
        variant: "default",
      });
      actions.push({
        targetStatus: "cestinato",
        label: "Cestina",
        icon: TrashIcon,
        variant: "danger",
      });
      break;

    case "cestinato":
      actions.push({
        targetStatus: "archiviato",
        label: "Ripristina",
        icon: ArchiveIcon,
        variant: "default",
      });
      // Elimina definitivamente - solo per founder
      if (isFounder) {
        actions.push({
          action: "delete",
          label: "Elimina definitivamente",
          icon: TrashIcon,
          variant: "danger",
          isDangerous: true,
        });
      }
      break;

    default:
      break;
  }

  return actions;
};
