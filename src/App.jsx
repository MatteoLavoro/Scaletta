import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WelcomePage, Dashboard, LoadingPage, ProjectPage } from "./pages";
import { AuthModal } from "./components/auth";
import { ProfileModal } from "./components/profile";
import InstallPopup from "./components/pwa/InstallModal";
import { usePWAInstall } from "./hooks/usePWAInstall";
import {
  updateProjectName,
  updateProjectColor,
  updateProjectStatus,
  deleteProject,
} from "./services/projects";

const MODAL_AUTH = "auth";
export const MODAL_PROFILE = "profile";

// Chiave sessionStorage per tracciare se il popup è già stato mostrato
const INSTALL_POPUP_SHOWN_KEY = "scaletta_install_popup_shown";

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { openModal, currentModal, closeAllModals } = useModal();
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [authMode, setAuthMode] = useState("login");
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentGroup, setCurrentGroup] = useState(null);
  // Key per forzare refresh della Dashboard
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

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

  // Gestione navigazione progetto
  const handleProjectClick = ({ project, group }) => {
    setCurrentProject(project);
    setCurrentGroup(group);
  };

  const handleBackFromProject = () => {
    setCurrentProject(null);
    setCurrentGroup(null);
  };

  // Gestori per aggiornamento/eliminazione progetto
  const handleProjectUpdated = (updatedProject) => {
    setCurrentProject(updatedProject);
  };

  const handleProjectDeleted = async () => {
    setCurrentProject(null);
    setCurrentGroup(null);
  };

  const handleUpdateProjectName = async (newName) => {
    if (!currentProject) return;
    await updateProjectName(currentProject.id, newName);
    setCurrentProject((prev) => ({ ...prev, name: newName }));
  };

  const handleUpdateProjectColor = async (newColor) => {
    if (!currentProject) return;
    await updateProjectColor(currentProject.id, newColor);
    setCurrentProject((prev) => ({ ...prev, color: newColor }));
    // Forza refresh Dashboard in background per aggiornare la card
    setDashboardRefreshKey((k) => k + 1);
  };

  const handleUpdateProjectStatus = async (newStatus) => {
    if (!currentProject) return;
    await updateProjectStatus(currentProject.id, newStatus);
    setCurrentProject((prev) => ({ ...prev, status: newStatus }));
    // Forza refresh Dashboard in background per aggiornare la card
    setDashboardRefreshKey((k) => k + 1);
  };

  const handleDeleteProject = async () => {
    if (!currentProject) return;
    await deleteProject(currentProject.id);
    // Forza refresh Dashboard per rimuovere il progetto eliminato
    setDashboardRefreshKey((k) => k + 1);
    setCurrentProject(null);
    setCurrentGroup(null);
    // Torna indietro nella history (la ProjectPage ha aggiunto un entry)
    window.history.back();
  };

  if (loading) return <LoadingPage />;
  if (isAuthenticated) {
    const isFounder = currentGroup?.founderId === user?.uid;

    return (
      <>
        {/* Dashboard - nascosta quando c’è un progetto selezionato */}
        <div className={currentProject ? "hidden" : ""}>
          <Dashboard
            key={dashboardRefreshKey}
            onProjectClick={handleProjectClick}
          />
        </div>

        {/* ProjectPage - mostrata quando c'è un progetto selezionato */}
        {currentProject && (
          <ProjectPage
            project={currentProject}
            isFounder={isFounder}
            onBack={handleBackFromProject}
            onUpdateName={handleUpdateProjectName}
            onUpdateColor={handleUpdateProjectColor}
            onUpdateStatus={handleUpdateProjectStatus}
            onDelete={handleDeleteProject}
          />
        )}

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
