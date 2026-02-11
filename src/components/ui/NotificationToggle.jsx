import { useState, useEffect } from "react";
import { BellIcon, BellOffIcon } from "../icons";
import {
  requestNotificationPermission,
  setNotificationsEnabled,
  getUserNotificationsEnabled,
} from "../../services/notifications";
import { useAuth } from "../../contexts/AuthContext";

/**
 * NotificationToggle - Toggle per abilitare/disabilitare notifiche
 * - Se non ancora abilitate (permessi non concessi) → bottone "Abilita"
 * - Se abilitate (permessi concessi) → slider per attivare/disattivare
 */
const NotificationToggle = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!user?.uid) return;

      // Verifica lo stato dei permessi browser
      const permission = Notification?.permission || "default";
      const granted = permission === "granted";
      setHasPermission(granted);

      // Se i permessi sono stati concessi, controlla lo stato in Firestore
      if (granted) {
        const enabled = await getUserNotificationsEnabled(user.uid);
        setIsEnabled(enabled);
      } else {
        setIsEnabled(false);
      }
    };

    checkNotificationStatus();
  }, [user?.uid]);

  const handleEnable = async () => {
    if (!user?.uid || isRequesting) return;

    setIsRequesting(true);
    try {
      const token = await requestNotificationPermission(user.uid);
      if (token) {
        setIsEnabled(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Errore abilitazione notifiche:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleToggle = async () => {
    if (!user?.uid || isRequesting) return;

    // Toggle attiva/disattiva
    const newState = !isEnabled;
    setIsEnabled(newState);

    try {
      await setNotificationsEnabled(user.uid, newState);
    } catch (error) {
      console.error("Errore toggle notifiche:", error);
      // Ripristina lo stato precedente in caso di errore
      setIsEnabled(!newState);
    }
  };

  // Se non ha i permessi → mostra bottone "Abilita"
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center w-full">
        <button
          onClick={handleEnable}
          disabled={isRequesting}
          className="
            flex items-center justify-center gap-2 px-4 py-2.5 
            bg-primary text-white rounded-lg font-medium 
            hover:opacity-90 active:scale-[0.98] 
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <BellIcon className="w-5 h-5" />
          {isRequesting ? "Abilitazione..." : "Abilita"}
        </button>
      </div>
    );
  }

  // Se ha i permessi → mostra slider on/off
  return (
    <div className="flex items-center justify-between w-full">
      {/* Sinistra: Icona + Stato */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div
          className={`
            flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200
            ${
              isEnabled
                ? "bg-bg-tertiary text-text-primary"
                : "bg-bg-tertiary text-text-muted"
            }
          `}
        >
          {isEnabled ? (
            <BellIcon className="w-5 h-5" />
          ) : (
            <BellOffIcon className="w-5 h-5" />
          )}
        </div>
        <span
          className={`text-sm font-medium transition-colors ${
            isEnabled ? "text-text-primary" : "text-text-secondary"
          }`}
        >
          {isEnabled ? "Attivate" : "Disattivate"}
        </span>
      </div>

      {/* Destra: Toggle Switch con pallino centrato */}
      <button
        onClick={handleToggle}
        disabled={isRequesting}
        aria-label={isEnabled ? "Disattiva notifiche" : "Attiva notifiche"}
        className={`
          relative inline-flex items-center h-7 w-12 sm:h-8 sm:w-14 shrink-0 rounded-full 
          transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isEnabled
              ? "bg-primary focus:ring-primary"
              : "bg-bg-tertiary hover:bg-divider focus:ring-text-tertiary"
          }
        `}
      >
        <span
          className={`
            inline-block h-5 w-5 sm:h-6 sm:w-6 rounded-full 
            bg-white shadow-sm transition-all duration-200
            ${isEnabled ? "translate-x-6 sm:translate-x-7" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
};

export default NotificationToggle;
