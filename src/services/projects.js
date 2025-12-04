import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import app from "./config";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_COLOR_ORDER,
} from "../utils/projectColors";

const db = getFirestore(app);
const PROJECTS_COLLECTION = "projects";

// Lista piatta di tutti i colori disponibili
const ALL_PROJECT_COLORS = PROJECT_COLOR_ORDER.flat();

/**
 * Ottiene un colore random non usato nel gruppo
 * @param {string} groupId - ID del gruppo
 * @returns {string} - ID del colore
 */
export const getRandomAvailableColor = async (groupId) => {
  try {
    // Ottieni i progetti del gruppo per vedere i colori usati
    const projects = await getProjectsByGroup(groupId);
    const usedColors = new Set(projects.map((p) => p.color).filter(Boolean));

    // Trova i colori non usati
    const availableColors = ALL_PROJECT_COLORS.filter(
      (c) => !usedColors.has(c)
    );

    if (availableColors.length > 0) {
      // Scegli un colore random tra quelli disponibili
      const randomIndex = Math.floor(Math.random() * availableColors.length);
      return availableColors[randomIndex];
    }

    // Se tutti i colori sono usati, scegli uno random qualsiasi
    const randomIndex = Math.floor(Math.random() * ALL_PROJECT_COLORS.length);
    return ALL_PROJECT_COLORS[randomIndex];
  } catch (error) {
    console.error("Errore ottenimento colore random:", error);
    return DEFAULT_PROJECT_COLOR;
  }
};

/**
 * Crea un nuovo progetto
 * @param {string} name - Nome del progetto
 * @param {string} groupId - ID del gruppo a cui appartiene
 * @param {object} creator - Utente creatore { uid, displayName, email }
 * @param {string} color - Colore del progetto (opzionale, se non fornito viene assegnato random)
 * @returns {object} - Progetto creato
 */
export const createProject = async (name, groupId, creator, color = null) => {
  // Se non viene fornito un colore, assegna uno random non usato
  const projectColor = color || (await getRandomAvailableColor(groupId));

  const projectId = doc(collection(db, PROJECTS_COLLECTION)).id;

  const projectData = {
    id: projectId,
    name: name.trim(),
    groupId,
    color: projectColor,
    createdAt: serverTimestamp(),
    createdBy: creator.uid,
    createdByName: creator.displayName || creator.email,
  };

  await setDoc(doc(db, PROJECTS_COLLECTION, projectId), projectData);

  return { ...projectData, createdAt: new Date() };
};

/**
 * Ottiene tutti i progetti di un gruppo
 * @param {string} groupId - ID del gruppo
 * @returns {array} - Lista di progetti
 */
export const getProjectsByGroup = async (groupId) => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("groupId", "==", groupId)
  );
  const snapshot = await getDocs(q);
  const projects = [];

  snapshot.forEach((doc) => {
    projects.push({ id: doc.id, ...doc.data() });
  });

  // Ordina per data di creazione (più recenti prima)
  projects.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB - dateA;
  });

  return projects;
};

/**
 * Ottiene un progetto tramite ID
 * @param {string} projectId - ID del progetto
 * @returns {object|null} - Progetto trovato o null
 */
export const getProjectById = async (projectId) => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) return null;

  return { id: projectSnap.id, ...projectSnap.data() };
};

/**
 * Aggiorna il nome del progetto
 * @param {string} projectId - ID del progetto
 * @param {string} newName - Nuovo nome
 */
export const updateProjectName = async (projectId, newName) => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    name: newName.trim(),
  });
};

/**
 * Aggiorna il colore del progetto
 * @param {string} projectId - ID del progetto
 * @param {string} color - Nuovo colore
 */
export const updateProjectColor = async (projectId, color) => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    color,
  });
};

/**
 * Elimina un progetto
 * @param {string} projectId - ID del progetto
 */
export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
};

/**
 * Conta i progetti di un gruppo
 * @param {string} groupId - ID del gruppo
 * @returns {number} - Numero di progetti
 */
export const countProjectsByGroup = async (groupId) => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("groupId", "==", groupId)
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};
