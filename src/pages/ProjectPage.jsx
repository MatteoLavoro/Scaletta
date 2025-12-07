import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeftIcon, InfoIcon, SettingsIcon } from "../components/icons";
import useColumnCount, { BOX_WIDTH, GAP } from "../hooks/useColumnCount";
import useBentoAnimation from "../hooks/useBentoAnimation";
import { useTheme } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import { ProjectInfoModal, StatusModal } from "../components/projects";
import { DropdownMenu } from "../components/ui";
import {
  AddBentoBoxButton,
  MobileAddFab,
  NoteBox,
  BaseBentoBox,
  TutorialBox,
} from "../components/bento";
import { getProjectColor, DEFAULT_PROJECT_COLOR } from "../utils/projectColors";
import { DEFAULT_PROJECT_STATUS } from "../utils/projectStatuses";
import {
  getBentoBoxes,
  createBentoBox,
  updateBentoBoxTitle,
  updateBentoBoxContent,
  deleteBentoBox,
  countBentoBoxes,
} from "../services/projects";

/**
 * ProjectPage - Pagina di un singolo progetto
 * Gestisce la history del browser come i modali
 *
 * @param {object} project - Dati del progetto
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {function} onBack - Callback per tornare indietro
 * @param {function} onUpdateName - Callback per aggiornare il nome del progetto
 * @param {function} onUpdateColor - Callback per aggiornare il colore del progetto
 * @param {function} onUpdateStatus - Callback per aggiornare lo stato del progetto
 * @param {function} onDelete - Callback per eliminare il progetto
 */
const ProjectPage = ({
  project,
  isFounder,
  currentUserId,
  onBack,
  onUpdateName,
  onUpdateColor,
  onUpdateStatus,
  onDelete,
}) => {
  const hasAddedHistoryRef = useRef(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const { hasNestedModals, wasPopstateHandled } = useModal();

  // Stato per i bento box del progetto
  const [bentoBoxes, setBentoBoxes] = useState([]);
  // Contatore per generare nomi univoci (box1, box2, etc.)
  const boxCounterRef = useRef(1);

  // Carica i box dal database all'avvio
  useEffect(() => {
    if (!project?.id) return;

    const loadBoxes = async () => {
      try {
        setIsLoading(true);
        const boxes = await getBentoBoxes(project.id);
        setBentoBoxes(boxes);
        // Imposta il contatore al numero successivo
        const count = await countBentoBoxes(project.id);
        boxCounterRef.current = count + 1;
      } catch (error) {
        console.error("Errore caricamento bento boxes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoxes();
  }, [project?.id]);

  // Funzione per aggiungere una nota (salva nel database)
  const handleAddNote = async () => {
    if (!project?.id) return;

    try {
      const noteCount =
        bentoBoxes.filter((b) => b.boxType === "note").length + 1;
      const newBox = await createBentoBox(project.id, {
        title: `Nota ${noteCount}`,
        boxType: "note",
        content: "",
      });
      boxCounterRef.current++;
      setBentoBoxes((prev) => [...prev, newBox]);
    } catch (error) {
      console.error("Errore creazione nota:", error);
    }
  };

  // Funzione per aggiornare il titolo di un box (salva nel database)
  const handleBoxTitleChange = async (boxId, newTitle) => {
    if (!project?.id) return;

    try {
      await updateBentoBoxTitle(project.id, boxId, newTitle);
      setBentoBoxes((prev) =>
        prev.map((box) =>
          box.id === boxId ? { ...box, title: newTitle } : box
        )
      );
    } catch (error) {
      console.error("Errore aggiornamento titolo box:", error);
    }
  };

  // Funzione per eliminare un box (elimina dal database)
  const handleDeleteBox = async (boxId) => {
    if (!project?.id) return;

    try {
      await deleteBentoBox(project.id, boxId);
      setBentoBoxes((prev) => prev.filter((box) => box.id !== boxId));
    } catch (error) {
      console.error("Errore eliminazione bento box:", error);
    }
  };

  // Funzione per aggiornare il contenuto di un box (es. nota)
  const handleBoxContentChange = async (boxId, newContent) => {
    if (!project?.id) return;

    try {
      await updateBentoBoxContent(project.id, boxId, newContent);
      setBentoBoxes((prev) =>
        prev.map((box) =>
          box.id === boxId ? { ...box, content: newContent } : box
        )
      );
    } catch (error) {
      console.error("Errore aggiornamento contenuto box:", error);
    }
  };

  // I box ordinati per data di creazione (più vecchi prima)
  const sortedBoxes = [...bentoBoxes].sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
    return dateA - dateB;
  });

  // Numero di colonne dinamico (si aggiorna al resize)
  const columnCount = useColumnCount();

  // Se non ci sono box, mostra il tutorial
  const hasBoxes = sortedBoxes.length > 0;

  // Array di tutti gli items per distribuzione
  const allItems = useMemo(() => {
    const items = [];

    // 1. Tutorial box (primo) - solo se non ci sono box utente
    if (!hasBoxes) {
      items.push({ id: "tutorial", type: "tutorial" });
    }

    // 2. Box utente (in mezzo)
    sortedBoxes.forEach((box) => {
      items.push({ ...box, type: "box" });
    });

    // 3. Add button (ultimo) - solo su desktop (su mobile è il FAB flottante)
    if (columnCount > 1) {
      items.push({ id: "add-button", type: "add" });
    }

    return items;
  }, [sortedBoxes, hasBoxes, columnCount]);

  // Hook per layout "shortest column first" + animazioni FLIP
  const { containerRef, columns } = useBentoAnimation(allItems, columnCount);

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
      if (e.key === "Escape" && !isInfoModalOpen && !isStatusModalOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isInfoModalOpen, isStatusModalOpen]);

  // Gestione cambio stato
  const handleStatusChange = async (newStatus) => {
    if (onUpdateStatus) {
      await onUpdateStatus(newStatus);
    }
  };

  // Gestione eliminazione definitiva
  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  // Costruisci il menu kebab - solo info e gestisci stato
  const menuItems = [
    // Info progetto
    {
      label: "Info progetto",
      icon: <InfoIcon className="w-5 h-5" />,
      onClick: () => setIsInfoModalOpen(true),
    },
    { separator: true },
    // Gestisci stato
    {
      label: "Gestisci stato",
      icon: <SettingsIcon className="w-5 h-5" />,
      onClick: () => setIsStatusModalOpen(true),
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
          {/* Freccia indietro - Sinistra con cerchietto */}
          <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            <button
              onClick={handleClose}
              className="
                flex items-center justify-center w-full h-full
                rounded-full
                hover:bg-black/10 active:bg-black/20
                transition-colors duration-150
              "
              style={{ color: projectColor.text }}
              aria-label="Torna alla home"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Nome progetto - Centro */}
          <h1
            className="text-lg font-semibold text-center flex-1 truncate px-2"
            style={{ color: projectColor.text }}
          >
            {project.name}
          </h1>

          {/* Kebab menu dropdown - Destra con cerchietto */}
          <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
            <DropdownMenu
              items={menuItems}
              buttonColor={projectColor.text}
              ariaLabel="Menu progetto"
              compact
            />
          </div>
        </header>

        {/* Contenuto principale - Bento Grid */}
        <main className={`flex-1 ${columnCount === 1 ? "px-2" : "p-4"}`}>
          {/* Padding extra in basso su mobile per il FAB flottante */}
          <div
            className="flex justify-center"
            style={{
              paddingTop: columnCount === 1 ? `${GAP}px` : "0",
              paddingBottom: columnCount === 1 ? "120px" : "0",
            }}
          >
            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              /* Griglia con tutti i box (normali + speciali) */
              <div
                ref={containerRef}
                className="flex items-start"
                style={{ gap: `${GAP}px` }}
              >
                {columns.map((colItems, colIdx) => (
                  <div
                    key={`col-${colIdx}`}
                    className="flex flex-col"
                    style={{
                      width: columnCount === 1 ? "100%" : `${BOX_WIDTH}px`,
                      gap: `${GAP}px`,
                    }}
                  >
                    {colItems.map((item) => {
                      // Tutorial box
                      if (item.type === "tutorial") {
                        return (
                          <div key={item.id} data-bento-id={item.id}>
                            <TutorialBox isMobile={columnCount === 1} />
                          </div>
                        );
                      }
                      // Add button box (solo desktop)
                      if (item.type === "add") {
                        return (
                          <div key={item.id} data-bento-id={item.id}>
                            <AddBentoBoxButton onAddNote={handleAddNote} />
                          </div>
                        );
                      }
                      // Render NoteBox per box di tipo "note"
                      if (item.boxType === "note") {
                        return (
                          <div key={item.id} data-bento-id={item.id}>
                            <NoteBox
                              title={item.title}
                              content={item.content || ""}
                              onTitleChange={(newTitle) =>
                                handleBoxTitleChange(item.id, newTitle)
                              }
                              onContentChange={(newContent) =>
                                handleBoxContentChange(item.id, newContent)
                              }
                              onDelete={() => handleDeleteBox(item.id)}
                            />
                          </div>
                        );
                      }
                      // Render BaseBentoBox per box generici (fallback)
                      return (
                        <div key={item.id} data-bento-id={item.id}>
                          <BaseBentoBox
                            title={item.title}
                            onTitleChange={(newTitle) =>
                              handleBoxTitleChange(item.id, newTitle)
                            }
                            onDelete={() => handleDeleteBox(item.id)}
                          >
                            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                              <span className="text-2xl mb-2 opacity-50">
                                📦
                              </span>
                              <span className="text-xs">Box generico</span>
                            </div>
                          </BaseBentoBox>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* FAB aggiunta box - solo mobile */}
        {columnCount === 1 && !isLoading && (
          <MobileAddFab onAddNote={handleAddNote} />
        )}
      </div>

      {/* Modale info progetto */}
      <ProjectInfoModal
        isOpen={isInfoModalOpen}
        project={project}
        isFounder={isFounder}
        onClose={() => setIsInfoModalOpen(false)}
        onUpdateName={onUpdateName}
        onUpdateColor={onUpdateColor}
      />

      {/* Modale gestione stato */}
      <StatusModal
        isOpen={isStatusModalOpen}
        project={project}
        isFounder={isFounder}
        currentUserId={currentUserId}
        onClose={() => setIsStatusModalOpen(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </>
  );
};

export default ProjectPage;
