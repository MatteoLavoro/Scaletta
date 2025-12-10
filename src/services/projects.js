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
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, listAll, deleteObject } from "firebase/storage";
import app from "./config";
import {
  DEFAULT_PROJECT_COLOR,
  PROJECT_COLOR_ORDER,
} from "../utils/projectColors";
import { DEFAULT_PROJECT_STATUS } from "../utils/projectStatuses";

const db = getFirestore(app);
const storage = getStorage(app);
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
    status: DEFAULT_PROJECT_STATUS, // Stato di default: "in-corso"
    createdAt: serverTimestamp(),
    createdBy: creator.uid,
    createdByName: creator.displayName || creator.email,
  };

  await setDoc(doc(db, PROJECTS_COLLECTION, projectId), projectData);

  return { ...projectData, createdAt: new Date() };
};

/**
 * Ottiene tutti i progetti di un gruppo
 * Ordinati per stato (in-corso > completato > archiviato > cestinato)
 * e poi per data di creazione (più recenti prima)
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

  // Priorità stati: in-corso (0), completato (1), archiviato (2), cestinato (3)
  const STATUS_PRIORITY = {
    "in-corso": 0,
    completato: 1,
    archiviato: 2,
    cestinato: 3,
  };

  // Ordina prima per stato, poi per data di creazione (più recenti prima)
  projects.sort((a, b) => {
    const statusA = STATUS_PRIORITY[a.status] ?? 99;
    const statusB = STATUS_PRIORITY[b.status] ?? 99;

    // Prima ordina per stato
    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // A parità di stato, ordina per data (più recenti prima)
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

// Priorità stati per ordinamento
const STATUS_PRIORITY = {
  "in-corso": 0,
  completato: 1,
  archiviato: 2,
  cestinato: 3,
};

/**
 * Funzione di ordinamento progetti per stato e data
 */
const sortProjects = (projects) => {
  return [...projects].sort((a, b) => {
    const statusA = STATUS_PRIORITY[a.status] ?? 99;
    const statusB = STATUS_PRIORITY[b.status] ?? 99;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB - dateA;
  });
};

/**
 * Sottoscrive ai progetti di un gruppo in tempo reale
 * @param {string} groupId - ID del gruppo
 * @param {function} onUpdate - Callback chiamata quando i progetti cambiano
 * @returns {function} - Funzione per annullare la sottoscrizione
 */
export const subscribeToGroupProjects = (groupId, onUpdate) => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where("groupId", "==", groupId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projects = [];
      snapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() });
      });

      onUpdate(sortProjects(projects));
    },
    (error) => {
      console.error("Errore sincronizzazione progetti gruppo:", error);
    }
  );
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
 * Aggiorna lo stato del progetto
 * @param {string} projectId - ID del progetto
 * @param {string} status - Nuovo stato
 */
export const updateProjectStatus = async (projectId, status) => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    status,
  });
};

/**
 * Elimina tutte le foto di un progetto dallo Storage
 * @param {string} projectId - ID del progetto
 */
const deleteProjectPhotos = async (projectId) => {
  try {
    const photosRef = ref(storage, `projects/${projectId}/photos`);
    const photosList = await listAll(photosRef);

    // Elimina tutti i file nella cartella photos
    const deletePromises = photosList.items.map((item) =>
      deleteObject(item).catch((err) => {
        console.error(`Errore eliminazione foto ${item.fullPath}:`, err);
      })
    );

    await Promise.all(deletePromises);
  } catch (error) {
    // Se la cartella non esiste, ignora l'errore
    if (error.code !== "storage/object-not-found") {
      console.error("Errore eliminazione foto progetto:", error);
    }
  }
};

/**
 * Elimina tutti i bento box di un progetto
 * @param {string} projectId - ID del progetto
 */
const deleteProjectBentoBoxes = async (projectId) => {
  const boxesRef = collection(db, PROJECTS_COLLECTION, projectId, "bentoBoxes");
  const snapshot = await getDocs(boxesRef);

  const deletePromises = snapshot.docs.map((boxDoc) => deleteDoc(boxDoc.ref));

  await Promise.all(deletePromises);
};

/**
 * Elimina un progetto con tutti i suoi contenuti
 * Include: bento boxes, foto nello storage
 * @param {string} projectId - ID del progetto
 */
export const deleteProject = async (projectId) => {
  // 1. Elimina tutte le foto dallo storage
  await deleteProjectPhotos(projectId);

  // 2. Elimina tutti i bento boxes
  await deleteProjectBentoBoxes(projectId);

  // 3. Elimina il documento del progetto
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
};

/**
 * Elimina un progetto con tutti i suoi contenuti (versione esportata per uso esterno)
 * Usata da groups.js per eliminare i progetti di un gruppo
 */
export const deleteProjectWithContents = deleteProject;

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

/**
 * Verifica se esiste già un progetto con lo stesso nome nel gruppo
 * @param {string} groupId - ID del gruppo
 * @param {string} name - Nome del progetto da verificare
 * @param {string} excludeProjectId - ID del progetto da escludere (per modifica nome)
 * @returns {boolean} - true se esiste già un progetto con quel nome
 */
export const projectNameExists = async (
  groupId,
  name,
  excludeProjectId = null
) => {
  const projects = await getProjectsByGroup(groupId);
  const normalizedName = name.trim().toLowerCase();

  return projects.some(
    (p) => p.name.toLowerCase() === normalizedName && p.id !== excludeProjectId
  );
};

// ===== BENTO BOX FUNCTIONS =====

/**
 * Ottiene tutti i bento box di un progetto
 * @param {string} projectId - ID del progetto
 * @returns {array} - Lista di bento box ordinati: pinnati prima (per pinnedAt), poi gli altri (per createdAt)
 */
export const getBentoBoxes = async (projectId) => {
  const boxesRef = collection(db, PROJECTS_COLLECTION, projectId, "bentoBoxes");
  const snapshot = await getDocs(boxesRef);
  const boxes = [];

  snapshot.forEach((doc) => {
    boxes.push({ id: doc.id, ...doc.data() });
  });

  // Ordina: pinnati prima (per pinnedAt crescente), poi non-pinnati (per createdAt crescente)
  boxes.sort((a, b) => {
    // Se entrambi pinnati, ordina per pinnedAt (prima chi è stato pinnato prima)
    if (a.isPinned && b.isPinned) {
      const pinA = a.pinnedAt?.toDate?.() || new Date(a.pinnedAt || 0);
      const pinB = b.pinnedAt?.toDate?.() || new Date(b.pinnedAt || 0);
      return pinA - pinB;
    }
    // Pinnati prima dei non-pinnati
    if (a.isPinned) return -1;
    if (b.isPinned) return 1;
    // Non-pinnati ordinati per createdAt
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return dateA - dateB;
  });

  return boxes;
};

/**
 * Crea un nuovo bento box
 * @param {string} projectId - ID del progetto
 * @param {object} boxData - Dati del box { title, height, boxType, content, photos }
 * @returns {object} - Box creato
 */
export const createBentoBox = async (projectId, boxData) => {
  const boxesRef = collection(db, PROJECTS_COLLECTION, projectId, "bentoBoxes");
  const boxId = doc(boxesRef).id;

  const newBox = {
    id: boxId,
    title: boxData.title || "Box",
    height: boxData.height || 200,
    boxType: boxData.boxType || "generic", // "generic", "note", "photo", etc.
    content: boxData.content || "", // Contenuto per le note
    photos: boxData.photos || [], // Array foto per PhotoBox
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(boxesRef, boxId), newBox);

  return { ...newBox, createdAt: new Date() };
};

/**
 * Aggiorna il titolo di un bento box
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box
 * @param {string} newTitle - Nuovo titolo
 */
export const updateBentoBoxTitle = async (projectId, boxId, newTitle) => {
  const boxRef = doc(db, PROJECTS_COLLECTION, projectId, "bentoBoxes", boxId);
  await updateDoc(boxRef, { title: newTitle.trim() });
};

/**
 * Aggiorna il contenuto di un bento box (es. nota)
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box
 * @param {string} newContent - Nuovo contenuto
 */
export const updateBentoBoxContent = async (projectId, boxId, newContent) => {
  const boxRef = doc(db, PROJECTS_COLLECTION, projectId, "bentoBoxes", boxId);
  await updateDoc(boxRef, { content: newContent });
};

/**
 * Aggiorna le foto di un bento box (PhotoBox)
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box
 * @param {array} photos - Array di foto { id, url, name, storagePath }
 */
export const updateBentoBoxPhotos = async (projectId, boxId, photos) => {
  const boxRef = doc(db, PROJECTS_COLLECTION, projectId, "bentoBoxes", boxId);
  await updateDoc(boxRef, { photos });
};

/**
 * Aggiorna lo stato pin di un bento box
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box
 * @param {boolean} isPinned - Se il box è pinnato
 * @param {number|null} pinnedAt - Timestamp di quando è stato pinnato (null se unpinned)
 */
export const updateBentoBoxPin = async (
  projectId,
  boxId,
  isPinned,
  pinnedAt
) => {
  const boxRef = doc(db, PROJECTS_COLLECTION, projectId, "bentoBoxes", boxId);
  await updateDoc(boxRef, {
    isPinned,
    pinnedAt: isPinned ? pinnedAt : null,
  });
};

/**
 * Elimina un bento box
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box
 */
export const deleteBentoBox = async (projectId, boxId) => {
  const boxRef = doc(db, PROJECTS_COLLECTION, projectId, "bentoBoxes", boxId);
  await deleteDoc(boxRef);
};

/**
 * Conta i bento box di un progetto
 * @param {string} projectId - ID del progetto
 * @returns {number} - Numero di box
 */
export const countBentoBoxes = async (projectId) => {
  const boxesRef = collection(db, PROJECTS_COLLECTION, projectId, "bentoBoxes");
  const snapshot = await getDocs(boxesRef);
  return snapshot.size;
};

/**
 * Sottoscrive ai cambiamenti dei bento box in tempo reale
 * @param {string} projectId - ID del progetto
 * @param {function} onUpdate - Callback chiamata quando i box cambiano
 * @returns {function} - Funzione per annullare la sottoscrizione
 */
export const subscribeToBentoBoxes = (projectId, onUpdate) => {
  const boxesRef = collection(db, PROJECTS_COLLECTION, projectId, "bentoBoxes");

  return onSnapshot(
    boxesRef,
    (snapshot) => {
      const boxes = [];
      snapshot.forEach((doc) => {
        boxes.push({ id: doc.id, ...doc.data() });
      });

      // Ordina: pinnati prima (per pinnedAt crescente), poi non-pinnati (per createdAt crescente)
      boxes.sort((a, b) => {
        // Se entrambi pinnati, ordina per pinnedAt (prima chi è stato pinnato prima)
        if (a.isPinned && b.isPinned) {
          const pinA = a.pinnedAt?.toDate?.() || new Date(a.pinnedAt || 0);
          const pinB = b.pinnedAt?.toDate?.() || new Date(b.pinnedAt || 0);
          return pinA - pinB;
        }
        // Pinnati prima dei non-pinnati
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        // Non-pinnati ordinati per createdAt
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      onUpdate(boxes);
    },
    (error) => {
      console.error("Errore sincronizzazione bento boxes:", error);
    }
  );
};

/**
 * Sottoscrive ai cambiamenti di un progetto in tempo reale
 * @param {string} projectId - ID del progetto
 * @param {function} onUpdate - Callback chiamata quando il progetto cambia
 * @returns {function} - Funzione per annullare la sottoscrizione
 */
export const subscribeToProject = (projectId, onUpdate) => {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  return onSnapshot(projectRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate({ id: docSnap.id, ...docSnap.data() });
    } else {
      onUpdate(null);
    }
  });
};
