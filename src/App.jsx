import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WelcomePage, Dashboard, LoadingPage } from "./pages";
import { AuthModal } from "./components/auth";
import { ProfileModal } from "./components/profile";

const MODAL_AUTH = "auth";
export const MODAL_PROFILE = "profile";

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const { openModal, currentModal, closeAllModals } = useModal();
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (isAuthenticated) closeAllModals();
  }, [isAuthenticated, closeAllModals]);

  if (loading) return <LoadingPage />;
  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        <ProfileModal isOpen={currentModal?.id === MODAL_PROFILE} />
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
