import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ModalProvider, useModal } from "./contexts/ModalContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingPage } from "./pages";
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

const Dashboard = lazy(() => import("./pages/Dashboard"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));
const ProjectPage = lazy(() => import("./pages/ProjectPage"));

const MODAL_AUTH = "auth";
export const MODAL_PROFILE = "profile";

// Chiave sessionStorage per tracciare se il popup è già stato mostrato
const INSTALL_POPUP_SHOWN_KEY = "scaletta_install_popup_shown";
// Chiavi sessionStorage per persistenza progetto corrente
const CURRENT_PROJECT_KEY = "scaletta_current_project";
const CURRENT_GROUP_KEY = "scaletta_current_group";

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { openModal, currentModal, closeAllModals } = useModal();
  const { isInstallable, isInstalled, install, deviceInfo } = usePWAInstall();
  const [authMode, setAuthMode] = useState("login");
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  // Inizializza stato progetto da sessionStorage per persistenza al reload
  const [currentProject, setCurrentProject] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CURRENT_PROJECT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentGroup, setCurrentGroup] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CURRENT_GROUP_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  // Key per forzare refresh della Dashboard
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  // Traccia progetti in eliminazione (per UI ottimistica)
  const [deletingProjectIds, setDeletingProjectIds] = useState(new Set());
  // Salva posizione scroll Dashboard prima di entrare in un progetto
  const dashboardScrollRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) closeAllModals();
  }, [isAuthenticated, closeAllModals]);

  // Inizializza le notifiche quando l'utente è autenticato
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const uid = user.uid;
      import("./utils/notificationInit").then(({ initializeNotifications }) => {
        initializeNotifications(uid);
      });
    }
  }, [isAuthenticated, user?.uid]);

  // Salva progetto/gruppo corrente in sessionStorage per persistenza al reload
  useEffect(() => {
    if (currentProject) {
      sessionStorage.setItem(
        CURRENT_PROJECT_KEY,
        JSON.stringify(currentProject),
      );
    } else {
      sessionStorage.removeItem(CURRENT_PROJECT_KEY);
    }
  }, [currentProject]);

  useEffect(() => {
    if (currentGroup) {
      sessionStorage.setItem(CURRENT_GROUP_KEY, JSON.stringify(currentGroup));
    } else {
      sessionStorage.removeItem(CURRENT_GROUP_KEY);
    }
  }, [currentGroup]);

  // Mostra il popup di installazione automaticamente
  useEffect(() => {
    // Controlla se il popup è già stato mostrato in questa sessione
    const alreadyShown = sessionStorage.getItem(INSTALL_POPUP_SHOWN_KEY);

    // Mostra il popup solo se:
    // - Non è stato ancora mostrato in questa sessione
    // - L'app non è già installata
    // - L'installazione diretta è disponibile (isInstallable) O è iOS/iPadOS
    const shouldShow =
      !alreadyShown && !isInstalled && (isInstallable || deviceInfo.isIOS);

    if (shouldShow) {
      // Piccolo ritardo per permettere alla pagina di caricarsi
      const timer = setTimeout(() => {
        setShowInstallPopup(true);
        sessionStorage.setItem(INSTALL_POPUP_SHOWN_KEY, "true");
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, deviceInfo]);

  // Ripristina scroll Dashboard quando si torna da un progetto
  useEffect(() => {
    if (!currentProject && shouldRestoreScrollRef.current) {
      shouldRestoreScrollRef.current = false;
      requestAnimationFrame(() => {
        window.scrollTo(0, dashboardScrollRef.current);
      });
    }
  }, [currentProject]);

  // Gestione navigazione progetto
  const handleProjectClick = ({ project, group }) => {
    dashboardScrollRef.current = window.scrollY;
    setCurrentProject(project);
    setCurrentGroup(group);
  };

  const handleBackFromProject = () => {
    shouldRestoreScrollRef.current = true;
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

    const projectId = currentProject.id;

    // 1. Aggiungi al Set dei progetti in eliminazione (per nascondere immediatamente dalla UI)
    setDeletingProjectIds((prev) => new Set(prev).add(projectId));

    // 2. Naviga immediatamente alla home
    setCurrentProject(null);
    setCurrentGroup(null);
    setDashboardRefreshKey((k) => k + 1);
    window.history.back();

    // 3. Elimina in background (senza await)
    deleteProject(projectId)
      .then(() => {
        // Rimuovi dal Set dopo un delay per permettere a onSnapshot di aggiornare
        setTimeout(() => {
          setDeletingProjectIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(projectId);
            return newSet;
          });
        }, 2000);
      })
      .catch((error) => {
        console.error("Errore eliminazione progetto:", error);
        // In caso di errore, rimuovi immediatamente dal Set così il progetto riappare
        setDeletingProjectIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
      });
  };

  if (loading) return <LoadingPage />;
  if (isAuthenticated) {
    const isFounder = currentGroup?.founderId === user?.uid;

    return (
      <Suspense fallback={<LoadingPage />}>
        <>
          {/* Dashboard - nascosta quando c’è un progetto selezionato */}
          <div className={currentProject ? "hidden" : ""}>
            <Dashboard
              key={dashboardRefreshKey}
              onProjectClick={handleProjectClick}
              deletingProjectIds={deletingProjectIds}
            />
          </div>

          {/* ProjectPage - mostrata quando c'è un progetto selezionato */}
          {currentProject && (
            <ProjectPage
              project={currentProject}
              group={currentGroup}
              isFounder={isFounder}
              currentUser={{
                uid: user?.uid,
                displayName: user?.displayName,
                email: user?.email,
              }}
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
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingPage />}>
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
    </Suspense>
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
