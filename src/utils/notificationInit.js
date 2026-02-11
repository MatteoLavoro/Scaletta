import { requestNotificationPermission } from "../services/notifications";

/**
 * Inizializza e registra il service worker per le notifiche Firebase
 */
export const registerFirebaseMessagingSW = async () => {
  if ("serviceWorker" in navigator) {
    try {
      // Disregistra eventuali service worker precedenti (pulizia)
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Se c'è un vecchio SW con scope diverso, disregistralo
        if (registration.scope !== `${location.origin}/`) {
          console.log(
            "🗑️ Rimozione vecchio service worker:",
            registration.scope,
          );
          await registration.unregister();
        }
      }

      // Registra il service worker di Firebase Messaging con scope root
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
        },
      );
      console.log("📝 Firebase Messaging SW registrato:", registration.scope);
      return registration;
    } catch (error) {
      console.error("❌ Errore registrazione Firebase Messaging SW:", error);
      return null;
    }
  }
  return null;
};

/**
 * Inizializza le notifiche per l'utente corrente
 * @param {string} userId - ID dell'utente
 */
export const initializeNotifications = async (userId) => {
  if (!userId) {
    console.log("🔔 Inizializzazione notifiche: userId mancante");
    return;
  }

  console.log("🔔 Inizializzo notifiche per utente:", userId);

  try {
    // Registra il service worker (ora include anche il caching PWA)
    console.log("📝 Registrazione service worker...");
    const registration = await registerFirebaseMessagingSW();

    if (!registration) {
      console.error("❌ Registrazione service worker fallita");
      return;
    }

    console.log("✅ Service worker registrato:", registration.scope);

    // Verifica se i permessi sono già stati concessi
    if (Notification.permission === "granted") {
      console.log("✅ Permessi notifiche già concessi, richiedo token...");
      // Richiedi il token FCM
      const token = await requestNotificationPermission(userId);
      if (token) {
        console.log("✅ Sistema notifiche inizializzato correttamente");
      } else {
        console.warn("⚠️ Token FCM non ottenuto");
      }
    } else {
      console.log("⚠️ Permessi notifiche non ancora concessi");
    }
  } catch (error) {
    console.error("❌ Errore inizializzazione notifiche:", error);
  }
};
