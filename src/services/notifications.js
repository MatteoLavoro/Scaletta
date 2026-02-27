import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "./config";

const db = getFirestore(app);
const NOTIFICATIONS_COLLECTION = "notifications";
const USER_TOKENS_COLLECTION = "userTokens";

// Chiave VAPID per FCM (dovrai generarla dalla console Firebase)
// Vai su Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY =
  "BEDXsPzY1t-0IkYaSiwwEz8NryEBM53KNxULFQI0gMtbZwVcrk3jMQwrpv_xbtfNpADtL2fwl9XVpJLaN_Eqx4U";

// URL della Cloud Function per inviare notifiche
const CLOUD_FUNCTION_URL = "https://sendnotification-3ujl6wiqia-uc.a.run.app";

let messaging = null;

/**
 * Inizializza Firebase Cloud Messaging
 */
const initializeMessaging = () => {
  if (typeof window === "undefined") return null;

  try {
    if (!messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error("Errore inizializzazione FCM:", error);
    return null;
  }
};

/**
 * Richiede il permesso per le notifiche e ottiene il token FCM
 * @param {string} userId - ID dell'utente
 * @returns {string|null} - Token FCM o null se fallito
 */
export const requestNotificationPermission = async (userId) => {
  if (!("Notification" in window)) {
    console.warn("Le notifiche non sono supportate da questo browser");
    return null;
  }

  try {
    // Richiedi permesso
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return null;
    }

    // Assicurati che il service worker sia pronto
    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.ready;
    }

    // Inizializza messaging
    const msg = initializeMessaging();
    if (!msg) {
      console.error("Impossibile inizializzare messaging");
      return null;
    }

    // Ottieni il token FCM
    const currentToken = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (currentToken) {
      // Salva il token nel database associato all'utente
      await saveUserToken(userId, currentToken);
      return currentToken;
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Errore richiesta permesso notifiche:", error);
    console.error("Dettagli errore:", error.code, error.message);
    return null;
  }
};

/**
 * Salva il token FCM dell'utente nel database
 * @param {string} userId - ID dell'utente
 * @param {string} token - Token FCM
 */
const saveUserToken = async (userId, token) => {
  try {
    const tokenDoc = doc(db, USER_TOKENS_COLLECTION, userId);
    await setDoc(
      tokenDoc,
      {
        token,
        enabled: true, // Di default le notifiche sono abilitate
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.error("❌ Errore salvataggio token FCM:", error);
    throw error;
  }
};

/**
 * Abilita o disabilita le notifiche per l'utente mantenendo il token
 * @param {string} userId - ID dell'utente
 * @param {boolean} enabled - Se abilitare o disabilitare
 */
export const setNotificationsEnabled = async (userId, enabled) => {
  const tokenDoc = doc(db, USER_TOKENS_COLLECTION, userId);
  await setDoc(
    tokenDoc,
    {
      enabled,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

/**
 * Verifica se le notifiche sono abilitate per l'utente
 * @param {string} userId - ID dell'utente
 * @returns {Promise<boolean>}
 */
export const getUserNotificationsEnabled = async (userId) => {
  try {
    const tokenDoc = doc(db, USER_TOKENS_COLLECTION, userId);
    const snapshot = await getDoc(tokenDoc);

    if (!snapshot.exists()) return false;

    const data = snapshot.data();
    return data.enabled !== false; // Default true se non specificato
  } catch (error) {
    console.error("Errore lettura stato notifiche:", error);
    return false;
  }
};

/**
 * Invia una notifica a tutti i membri di un gruppo
 * Le notifiche vengono sempre inviate immediatamente (push)
 * Se scheduledFor è impostato, la notifica appare solo da quell'orario
 * @param {string} groupId - ID del gruppo
 * @param {string} projectId - ID del progetto
 * @param {string} projectName - Nome del progetto
 * @param {string} message - Messaggio della notifica
 * @param {object} sender - Dati del mittente { uid, displayName, accentColor }
 * @param {Array} memberIds - Array di ID utenti membri del gruppo
 * @param {Date} scheduledFor - Data/ora programmata (opzionale, null = visibile subito)
 * @param {Array} taggedBoxes - Array di box taggati [{ id, title, boxType }] (opzionale)
 */
export const sendNotificationToGroup = async (
  groupId,
  projectId,
  projectName,
  message,
  sender,
  memberIds,
  scheduledFor = null,
  taggedBoxes = [],
) => {
  if (!message || !message.trim()) {
    throw new Error("Il messaggio non può essere vuoto");
  }

  try {
    // Salva la notifica nel database
    const notificationId = doc(collection(db, NOTIFICATIONS_COLLECTION)).id;
    const notificationData = {
      id: notificationId,
      groupId,
      projectId,
      projectName,
      message: message.trim(),
      senderId: sender.uid,
      senderName: sender.displayName,
      senderAccentColor: sender.accentColor || "teal", // Colore tema del mittente
      taggedBoxes: taggedBoxes || [], // Box taggati nel messaggio
      createdAt: serverTimestamp(),
      sentAt: serverTimestamp(),
      read: false,
      status: "sent",
      // Se programmata, imposta quando diventa visibile
      ...(scheduledFor && {
        visibleFrom: scheduledFor,
      }),
    };

    await setDoc(
      doc(db, NOTIFICATIONS_COLLECTION, notificationId),
      notificationData,
    );

    // Invia sempre le notifiche push immediatamente
    sendPushNotifications(
      groupId,
      projectId,
      projectName,
      sender,
      message,
      memberIds,
    ).catch((error) => {
      console.error("Errore invio push in background:", error);
    });

    return notificationData;
  } catch (error) {
    console.error("Errore invio notifica:", error);
    throw error;
  }
};

/**
 * Invia le notifiche push tramite Cloud Function (background)
 */
const sendPushNotifications = async (
  groupId,
  projectId,
  projectName,
  sender,
  message,
  memberIds,
) => {
  if (
    !CLOUD_FUNCTION_URL ||
    CLOUD_FUNCTION_URL === "YOUR_CLOUD_FUNCTION_URL_HERE"
  ) {
    console.warn(
      "Cloud Function URL non configurato. Le notifiche push non verranno inviate.",
    );
    return;
  }

  try {
    // Invia solo agli userId (escluso il mittente)
    const recipientIds = memberIds.filter((id) => id !== sender.uid);

    if (recipientIds.length === 0) {
      return;
    }

    const payload = {
      groupId,
      projectId,
      projectName,
      senderId: sender.uid,
      senderName: sender.displayName,
      title: `${projectName} - ${sender.displayName}`,
      body: message,
      recipientIds,
    };

    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      console.error("Errore invio notifiche push:", result.error);
    }
  } catch (error) {
    console.error("Errore chiamata Cloud Function:", error);
  }
};

/**
 * Ottiene tutte le notifiche di un progetto
 * @param {string} projectId - ID del progetto
 * @returns {Array} - Array di notifiche
 */
export const getProjectNotifications = async (projectId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
    );

    const snapshot = await getDocs(q);
    const notifications = [];

    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    return notifications;
  } catch (error) {
    console.error("Errore recupero notifiche progetto:", error);
    return [];
  }
};

/**
 * Sottoscrive alle notifiche di un progetto in tempo reale
 * Filtra le notifiche che hanno visibleFrom futuro
 * @param {string} projectId - ID del progetto
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {function} callback - Funzione chiamata con le notifiche
 * @returns {function} - Funzione per annullare la sottoscrizione
 */
export const subscribeToProjectNotifications = (
  projectId,
  currentUserId,
  callback,
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = [];
      const now = new Date();

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };

        // Se ha visibleFrom, mostrala solo se l'orario è passato
        if (data.visibleFrom) {
          const visibleDate = data.visibleFrom.toDate
            ? data.visibleFrom.toDate()
            : new Date(data.visibleFrom);

          // Il mittente vede sempre le sue notifiche programmate
          if (data.senderId === currentUserId) {
            notifications.push(data);
          }
          // Gli altri le vedono solo se l'orario è arrivato
          else if (visibleDate <= now) {
            notifications.push(data);
          }
        } else {
          // Notifiche immediate: tutti le vedono
          notifications.push(data);
        }
      });

      callback(notifications);
    },
    (error) => {
      console.error("Errore sottoscrizione notifiche:", error);
      callback([]);
    },
  );
};

/**
 * Configura il listener per le notifiche in foreground
 * @param {function} callback - Funzione chiamata quando arriva una notifica
 */
export const setupForegroundMessageListener = (callback) => {
  const msg = initializeMessaging();
  if (!msg) return () => {};

  return onMessage(msg, (payload) => {
    console.log("Notifica ricevuta in foreground:", payload);
    if (callback) {
      callback(payload);
    }
  });
};

/**
 * Verifica se le notifiche sono supportate e abilitate
 * @returns {boolean}
 */
export const areNotificationsEnabled = () => {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
};

/**
 * Conta le notifiche non lette per un progetto
 * Non conta le notifiche con visibleFrom futuro
 * @param {string} projectId - ID del progetto
 * @param {string} userId - ID dell'utente corrente
 * @returns {Promise<number>} - Numero di notifiche non lette
 */
export const getUnreadNotificationsCount = async (projectId, userId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("projectId", "==", projectId),
      where("read", "==", false),
    );

    const snapshot = await getDocs(q);
    let unreadCount = 0;
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Conta solo se non sono il mittente
      if (data.senderId === userId) {
        return;
      }

      // Se ha visibleFrom, contala solo se l'orario è arrivato
      if (data.visibleFrom) {
        const visibleDate = data.visibleFrom.toDate
          ? data.visibleFrom.toDate()
          : new Date(data.visibleFrom);
        if (visibleDate > now) {
          return; // Non contare se non ancora visibile
        }
      }

      unreadCount++;
    });

    return unreadCount;
  } catch (error) {
    console.error("Errore conteggio notifiche non lette:", error);
    return 0;
  }
};

/**
 * Sottoscrive al conteggio notifiche non lette in tempo reale
 * Non conta le notifiche con visibleFrom futuro
 * @param {string} projectId - ID del progetto
 * @param {string} userId - ID dell'utente corrente
 * @param {function} callback - Funzione chiamata con il conteggio
 * @returns {function} - Funzione per annullare la sottoscrizione
 */
export const subscribeToUnreadCount = (projectId, userId, callback) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("projectId", "==", projectId),
    where("read", "==", false),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      let unreadCount = 0;
      const now = new Date();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Non contare se sono il mittente
        if (data.senderId === userId) return;

        // Se ha visibleFrom, contala solo se l'orario è arrivato
        if (data.visibleFrom) {
          const visibleDate = data.visibleFrom.toDate
            ? data.visibleFrom.toDate()
            : new Date(data.visibleFrom);
          if (visibleDate > now) return;
        }

        unreadCount++;
      });

      callback(unreadCount);
    },
    (error) => {
      console.error("Errore sottoscrizione conteggio non lette:", error);
      callback(0);
    },
  );
};

/**
 * Marca tutte le notifiche visibili di un progetto come lette per un utente
 * Non marca quelle con visibleFrom futuro
 * @param {string} projectId - ID del progetto
 * @param {string} userId - ID dell'utente corrente
 */
export const markProjectNotificationsAsRead = async (projectId, userId) => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("projectId", "==", projectId),
      where("read", "==", false),
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    const now = new Date();

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      // Non marcare come lette le mie notifiche
      if (data.senderId === userId) return;

      // Se ha visibleFrom, marcala solo se l'orario è arrivato
      if (data.visibleFrom) {
        const visibleDate = data.visibleFrom.toDate
          ? data.visibleFrom.toDate()
          : new Date(data.visibleFrom);
        if (visibleDate > now) return;
      }

      // Marca come letta
      batch.update(docSnapshot.ref, { read: true });
    });

    await batch.commit();
    console.log(`Notifiche del progetto ${projectId} marcate come lette`);
  } catch (error) {
    console.error("Errore marcatura notifiche come lette:", error);
  }
};
