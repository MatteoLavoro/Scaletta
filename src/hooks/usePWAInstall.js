import { useState, useEffect } from "react";

/**
 * Hook per gestire l'installazione PWA
 * Rileva se l'app può essere installata e fornisce la funzione di installazione
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Controlla se l'app è già installata
    const checkInstalled = () => {
      // Standalone mode (PWA installata)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      // iOS standalone
      if (window.navigator.standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) return;

    // Cattura l'evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Rileva quando l'app viene installata
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Funzione per avviare l'installazione
  const install = async () => {
    if (!installPrompt) return false;

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setInstallPrompt(null);
      return outcome === "accepted";
    } catch (error) {
      console.error("Errore installazione PWA:", error);
      return false;
    }
  };

  // Rileva il sistema operativo per istruzioni specifiche
  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChrome = /Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);

    return {
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      isFirefox,
      isMobile: isIOS || isAndroid,
      // iOS non supporta beforeinstallprompt, mostra istruzioni manuali
      needsManualInstall: isIOS,
    };
  };

  return {
    isInstallable,
    isInstalled,
    install,
    deviceInfo: getDeviceInfo(),
  };
};
