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
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import app from "./config";
import { deleteProjectWithContents } from "./projects";

const db = getFirestore(app);
const GROUPS_COLLECTION = "groups";
const PROJECTS_COLLECTION = "projects";

/**
 * Genera un codice casuale di 8 caratteri alfanumerici (maiuscole e numeri)
 */
const generateGroupCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Verifica se un codice gruppo è già in uso
 */
const isCodeInUse = async (code) => {
  const q = query(collection(db, GROUPS_COLLECTION), where("code", "==", code));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Genera un codice univoco
 */
const generateUniqueCode = async () => {
  let code = generateGroupCode();
  let attempts = 0;
  const maxAttempts = 10;

  while ((await isCodeInUse(code)) && attempts < maxAttempts) {
    code = generateGroupCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Impossibile generare un codice univoco");
  }

  return code;
};

/**
 * Crea un nuovo gruppo
 * @param {string} name - Nome del gruppo
 * @param {object} creator - Utente creatore { uid, displayName, email }
 * @returns {object} - Gruppo creato
 */
export const createGroup = async (name, creator) => {
  const code = await generateUniqueCode();
  const groupId = doc(collection(db, GROUPS_COLLECTION)).id;

  const groupData = {
    id: groupId,
    name: name.trim(),
    code,
    createdAt: serverTimestamp(),
    founderId: creator.uid,
    founderName: creator.displayName || creator.email,
    members: [
      {
        uid: creator.uid,
        displayName: creator.displayName || "Utente",
        email: creator.email,
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  await setDoc(doc(db, GROUPS_COLLECTION, groupId), groupData);

  return { ...groupData, createdAt: new Date() };
};

/**
 * Ottiene un gruppo tramite codice
 * @param {string} code - Codice di 8 cifre
 * @returns {object|null} - Gruppo trovato o null
 */
export const getGroupByCode = async (code) => {
  const q = query(collection(db, GROUPS_COLLECTION), where("code", "==", code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

/**
 * Unisciti a un gruppo tramite codice
 * @param {string} code - Codice del gruppo
 * @param {object} user - Utente che si unisce { uid, displayName, email }
 * @returns {object} - Gruppo aggiornato
 */
export const joinGroup = async (code, user) => {
  const group = await getGroupByCode(code);

  if (!group) {
    throw new Error("Gruppo non trovato. Verifica il codice inserito.");
  }

  // Verifica se l'utente è già membro
  const isMember = group.members.some((m) => m.uid === user.uid);
  if (isMember) {
    throw new Error("Sei già membro di questo gruppo.");
  }

  const newMember = {
    uid: user.uid,
    displayName: user.displayName || "Utente",
    email: user.email,
    joinedAt: new Date().toISOString(),
  };

  await updateDoc(doc(db, GROUPS_COLLECTION, group.id), {
    members: arrayUnion(newMember),
  });

  return { ...group, members: [...group.members, newMember] };
};

/**
 * Ottiene tutti i gruppi di un utente
 * @param {string} userId - ID dell'utente
 * @returns {array} - Lista di gruppi
 */
export const getUserGroups = async (userId) => {
  const snapshot = await getDocs(collection(db, GROUPS_COLLECTION));
  const groups = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const isMember = data.members?.some((m) => m.uid === userId);
    if (isMember) {
      groups.push({ id: doc.id, ...data });
    }
  });

  // Ordina per data di creazione (più recenti prima)
  groups.sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
    return dateB - dateA;
  });

  return groups;
};

/**
 * Aggiorna il nome del gruppo
 * @param {string} groupId - ID del gruppo
 * @param {string} newName - Nuovo nome
 */
export const updateGroupName = async (groupId, newName) => {
  await updateDoc(doc(db, GROUPS_COLLECTION, groupId), {
    name: newName.trim(),
  });
};

/**
 * Esci da un gruppo
 * @param {string} groupId - ID del gruppo
 * @param {object} user - Utente che esce { uid }
 */
export const leaveGroup = async (groupId, user) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    throw new Error("Gruppo non trovato");
  }

  const groupData = groupSnap.data();
  const memberToRemove = groupData.members.find((m) => m.uid === user.uid);

  if (!memberToRemove) {
    throw new Error("Non sei membro di questo gruppo");
  }

  await updateDoc(groupRef, {
    members: arrayRemove(memberToRemove),
  });
};

/**
 * Elimina un gruppo (solo il founder può farlo)
 * Elimina anche tutti i progetti associati al gruppo con foto e bento boxes
 * @param {string} groupId - ID del gruppo
 * @param {string} userId - ID dell'utente che richiede l'eliminazione
 */
export const deleteGroup = async (groupId, userId) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) {
    throw new Error("Gruppo non trovato");
  }

  const groupData = groupSnap.data();

  if (groupData.founderId !== userId) {
    throw new Error("Solo il creatore può eliminare il gruppo");
  }

  // Ottieni tutti i progetti del gruppo
  const projectsQuery = query(
    collection(db, PROJECTS_COLLECTION),
    where("groupId", "==", groupId)
  );
  const projectsSnapshot = await getDocs(projectsQuery);

  // Elimina ogni progetto con tutti i suoi contenuti (foto, bento boxes)
  const deletePromises = projectsSnapshot.docs.map((projectDoc) =>
    deleteProjectWithContents(projectDoc.id)
  );
  await Promise.all(deletePromises);

  // Elimina il gruppo
  await deleteDoc(groupRef);
};

/**
 * Ottiene un gruppo tramite ID
 * @param {string} groupId - ID del gruppo
 * @returns {object|null} - Gruppo trovato o null
 */
export const getGroupById = async (groupId) => {
  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) return null;

  return { id: groupSnap.id, ...groupSnap.data() };
};
