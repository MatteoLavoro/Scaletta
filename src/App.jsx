import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WelcomePage, Dashboard, LoadingPage } from "./pages";
import { AuthModal } from "./components/auth";
import { ProfileModal } from "./components/profile";
import InstallPopup from "./components/pwa/InstallModal";
import { usePWAInstall } from "./hooks/usePWAInstall";

const MODAL_AUTH = "auth";
export const MODAL_PROFILE = "profile";

// Chiave sessionStorage per tracciare se il popup è già stato mostrato
const INSTALL_POPUP_SHOWN_KEY = "scaletta_install_popup_shown";

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { openModal, currentModal, closeAllModals } = useModal();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [authMode, setAuthMode] = useState("login");
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  useEffect(() => {
    if (isAuthenticated) closeAllModals();
  }, [isAuthenticated, closeAllModals]);

  // Mostra il popup di installazione automaticamente
  useEffect(() => {
    // Controlla se il popup è già stato mostrato in questa sessione
    const alreadyShown = sessionStorage.getItem(INSTALL_POPUP_SHOWN_KEY);

    // Mostra il popup solo se:
    // - Non è stato ancora mostrato in questa sessione
    // - L'app non è già installata
    // - L'installazione diretta è disponibile (isInstallable)
    if (!alreadyShown && !isInstalled && isInstallable) {
      // Piccolo ritardo per permettere alla pagina di caricarsi
      const timer = setTimeout(() => {
        setShowInstallPopup(true);
        sessionStorage.setItem(INSTALL_POPUP_SHOWN_KEY, "true");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  if (loading) return <LoadingPage />;
  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        <ProfileModal isOpen={currentModal?.id === MODAL_PROFILE} />
        <InstallPopup
          isOpen={showInstallPopup}
          onClose={() => setShowInstallPopup(false)}
          onInstall={install}
        />
      </>
    );
  }

  return (
    <>
      <WelcomePage
        onLogin={() => {
          setAuthMode("login");
          openModal(MODAL_AUTH);
        }}
        onRegister={() => {
          setAuthMode("register");
          openModal(MODAL_AUTH);
        }}
      />
      <AuthModal
        isOpen={currentModal?.id === MODAL_AUTH}
        initialMode={authMode}
      />
      <InstallPopup
        isOpen={showInstallPopup}
        onClose={() => setShowInstallPopup(false)}
        onInstall={install}
      />
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <ModalProvider>
        <AppContent />
      </ModalProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
