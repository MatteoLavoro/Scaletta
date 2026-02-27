/**
 * Utility per gestire le visualizzazioni dei progetti
 * Traccia quando un utente ha visto l'ultimo un progetto
 * Usa localStorage per la persistenza
 */

const PROJECT_VIEWS_KEY = "scaletta_project_views";

/**
 * Ottiene tutte le visualizzazioni salvate
 * @returns {object} - Oggetto con projectId come chiave e timestamp come valore
 */
const getProjectViews = () => {
  try {
    const stored = localStorage.getItem(PROJECT_VIEWS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Salva le visualizzazioni
 * @param {object} views - Oggetto views da salvare
 */
const saveProjectViews = (views) => {
  try {
    localStorage.setItem(PROJECT_VIEWS_KEY, JSON.stringify(views));
  } catch (error) {
    console.error("Errore salvataggio views:", error);
  }
};

/**
 * Marca un progetto come visualizzato ora
 * @param {string} projectId - ID del progetto
 */
export const markProjectAsViewed = (projectId) => {
  const views = getProjectViews();
  views[projectId] = Date.now();
  saveProjectViews(views);
};

/**
 * Ottiene il timestamp dell'ultima visualizzazione di un progetto
 * @param {string} projectId - ID del progetto
 * @returns {number|null} - Timestamp o null se mai visualizzato
 */
export const getProjectLastView = (projectId) => {
  const views = getProjectViews();
  return views[projectId] || null;
};

/**
 * Verifica se un progetto ha attività più recenti dell'ultima visualizzazione
 * @param {object} project - Oggetto progetto con lastActivityAt
 * @param {string} currentUserId - ID dell'utente corrente
 * @returns {boolean} - true se ci sono news, false altrimenti
 */
export const hasProjectNews = (project, currentUserId) => {
  if (!project?.lastActivityAt) return false;

  // Non mostrare news se l'ultima attività è stata fatta dall'utente corrente
  if (project.lastActivityBy === currentUserId) return false;

  const lastView = getProjectLastView(project.id);

  // Converti lastActivityAt in timestamp
  const activityTimestamp = project.lastActivityAt.toDate
    ? project.lastActivityAt.toDate().getTime()
    : new Date(project.lastActivityAt).getTime();

  // Se non ha mai visualizzato, mostra badge se c'è attività recente (ultimi 7 giorni)
  if (!lastView) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return activityTimestamp > sevenDaysAgo;
  }

  // Se ha già visualizzato, mostra badge se l'attività è più recente dell'ultima visualizzazione
  return activityTimestamp > lastView;
};
