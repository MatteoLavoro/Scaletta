import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import { ProjectInfoModal } from "../components/projects";
import { DropdownMenu } from "../components/ui";
import { getProjectColor, DEFAULT_PROJECT_COLOR } from "../utils/projectColors";

/**
 * ProjectPage - Pagina di un singolo progetto
 * Gestisce la history del browser come i modali
 *
 * @param {object} project - Dati del progetto
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @param {function} onBack - Callback per tornare indietro
 * @param {function} onUpdateName - Callback per aggiornare il nome del progetto
 * @param {function} onUpdateColor - Callback per aggiornare il colore del progetto
 * @param {function} onDelete - Callback per eliminare il progetto
 */
const ProjectPage = ({
  project,
  isFounder,
  onBack,
  onUpdateName,
  onUpdateColor,
  onDelete,
}) => {
  const hasAddedHistoryRef = useRef(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const { isDark } = useTheme();
  const { hasNestedModals, wasPopstateHandled } = useModal();

  // Ottieni il colore del progetto
  const projectColor = getProjectColor(
    project?.color || DEFAULT_PROJECT_COLOR,
    isDark
  );

  // Chiusura tramite history.back() per mantenere sincronizzazione
  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  // Gestione history browser
  useEffect(() => {
    if (!project) return;

    // Aggiungi entry nella history
    if (!hasAddedHistoryRef.current) {
      window.history.pushState(
        { projectPage: true, projectId: project.id },
        ""
      );
      hasAddedHistoryRef.current = true;
    }

    // Handler per popstate (back button browser/Android)
    const handlePopState = () => {
      // Se il popstate è stato già gestito da un modale, non fare nulla
      if (wasPopstateHandled()) return;

      // Non reagire se ci sono ancora modali annidati aperti
      if (hasNestedModals()) return;

      // Altrimenti torna alla home
      onBack();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [project, onBack, hasNestedModals, wasPopstateHandled]);

  // Gestione tasto ESC (solo se non c'è un modale aperto)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isInfoModalOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isInfoModalOpen]);

  // Gestione eliminazione progetto
  const handleProjectDeleted = async () => {
    setIsInfoModalOpen(false);
    if (onDelete) {
      await onDelete();
    }
  };

  // Opzioni menu kebab
  const menuItems = [
    {
      label: "Info progetto",
      icon: <Info className="w-5 h-5" />,
      onClick: () => setIsInfoModalOpen(true),
    },
  ];

  if (!project) return null;

  return (
    <>
      <div className="min-h-dvh flex flex-col bg-bg-primary">
        {/* Header - stile standard con colore progetto */}
        <header
          className="flex items-center justify-between px-4 py-3 min-h-14 border-b border-border sticky top-0 z-50"
          style={{ backgroundColor: projectColor.bg }}
        >
          {/* Freccia indietro - Sinistra (stesso stile dei modali) */}
          <button
            onClick={handleClose}
            className="
              flex items-center justify-center w-10 h-10 -ml-1
              rounded-full
              hover:bg-black/10 active:bg-black/20
              transition-colors duration-150
            "
            style={{ color: projectColor.text }}
            aria-label="Torna alla home"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Nome progetto - Centro */}
          <h1
            className="text-lg font-semibold text-center flex-1 truncate px-2"
            style={{ color: projectColor.text }}
          >
            {project.name}
          </h1>

          {/* Kebab menu dropdown - Destra */}
          <DropdownMenu
            items={menuItems}
            buttonColor={projectColor.text}
            ariaLabel="Menu progetto"
          />
        </header>

        {/* Contenuto principale - vuoto per ora */}
        <main className="flex-1 p-5">
          <div className="max-w-2xl mx-auto">
            {/* Placeholder contenuto futuro */}
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 flex items-center justify-center bg-primary/10 rounded-2xl mb-4">
                <span className="text-2xl">🚧</span>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Pagina in costruzione
              </h2>
              <p className="text-text-secondary text-sm">
                Qui verranno mostrati i contenuti del progetto.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Modale info progetto */}
      <ProjectInfoModal
        isOpen={isInfoModalOpen}
        project={project}
        isFounder={isFounder}
        onClose={() => setIsInfoModalOpen(false)}
        onUpdateName={onUpdateName}
        onUpdateColor={onUpdateColor}
        onDelete={handleProjectDeleted}
      />
    </>
  );
};

export default ProjectPage;
