import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeftIcon, InfoIcon, SettingsIcon } from "../components/icons";
import useColumnCount, { BOX_WIDTH, GAP } from "../hooks/useColumnCount";
import useBentoAnimation from "../hooks/useBentoAnimation";
import { useTheme } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import { ProjectInfoModal, StatusModal } from "../components/projects";
import { DropdownMenu } from "../components/ui";
import {
  MobileAddFab,
  DesktopAddFab,
  NoteBox,
  PhotoBox,
  PdfBox,
  FileBox,
  ChecklistBox,
  AnagraficaBox,
  BaseBentoBox,
  TutorialBox,
  CameraFab,
} from "../components/bento";
import { MoreBoxesModal } from "../components/modal";
import { getProjectColor, DEFAULT_PROJECT_COLOR } from "../utils/projectColors";
import {
  createBentoBox,
  updateBentoBoxTitle,
  updateBentoBoxContent,
  updateBentoBoxPhotos,
  updateBentoBoxPdfs,
  updateBentoBoxFiles,
  updateBentoBoxChecklistItems,
  updateBentoBoxAnagraficaFields,
  updateBentoBoxAnagraficaCustomFields,
  updateBentoBoxPin,
  deleteBentoBox,
  subscribeToBentoBoxes,
} from "../services/projects";
import { deletePhotos, uploadPhoto } from "../services/photos";
import { deleteFiles } from "../services/files";
import { deletePdfs } from "../services/pdfs";

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
  const [isMoreBoxesModalOpen, setIsMoreBoxesModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark } = useTheme();
  const { hasNestedModals, wasPopstateHandled } = useModal();

  // Stato per i bento box del progetto
  const [bentoBoxes, setBentoBoxes] = useState([]);

  // Traccia i box che sono stati modificati durante questa sessione
  // I box in questo Set non verranno eliminati automaticamente
  const modifiedBoxesRef = useRef(new Set());

  // Sottoscrizione in tempo reale ai bento boxes
  useEffect(() => {
    if (!project?.id) return;

    setIsLoading(true);

    // Usa onSnapshot per sincronizzazione in tempo reale
    const unsubscribe = subscribeToBentoBoxes(project.id, (boxes) => {
      setBentoBoxes(boxes);
      setIsLoading(false);
    });

    // Cleanup: annulla la sottoscrizione quando il componente si smonta
    return () => unsubscribe();
  }, [project?.id]);

  // Funzione per verificare se un box è vuoto (nessun contenuto significativo)
  const isBoxEmpty = useCallback((box) => {
    if (box.boxType === "note") {
      return !box.content || box.content.trim().length === 0;
    }
    if (box.boxType === "photo") {
      return !box.photos || box.photos.length === 0;
    }
    if (box.boxType === "file") {
      return !box.files || box.files.length === 0;
    }
    if (box.boxType === "checklist") {
      return !box.checklistItems || box.checklistItems.length === 0;
    }
    if (box.boxType === "pdf") {
      return !box.pdfs || box.pdfs.length === 0;
    }
    if (box.boxType === "anagrafica") {
      // Non considerare mai vuoto un box anagrafica
      return false;
    }
    return false; // Non eliminare box di tipo sconosciuto
  }, []);

  // Funzione per pulire i box vuoti e non modificati (chiamata quando si torna alla home)
  const cleanupEmptyBoxes = useCallback(async () => {
    if (!project?.id || bentoBoxes.length === 0) return;

    const boxesToDelete = bentoBoxes.filter((box) => {
      // Non eliminare i box pinnati
      if (box.isPinned) return false;
      // Non eliminare i box che sono stati modificati
      if (modifiedBoxesRef.current.has(box.id)) return false;
      // Elimina solo i box vuoti
      return isBoxEmpty(box);
    });

    // Elimina i box in background (senza await per non bloccare la navigazione)
    for (const box of boxesToDelete) {
      try {
        // Elimina anche foto/file/pdf dallo storage se presenti
        if (box.boxType === "photo" && box.photos?.length > 0) {
          await deletePhotos(box.photos.map((p) => p.storagePath));
        }
        if (box.boxType === "file" && box.files?.length > 0) {
          await deleteFiles(box.files);
        }
        if (box.boxType === "pdf" && box.pdfs?.length > 0) {
          await deletePdfs(box.pdfs);
        }
        await deleteBentoBox(project.id, box.id);
        console.log(`Box vuoto "${box.title}" eliminato automaticamente`);
      } catch (error) {
        console.error("Errore eliminazione automatica box:", error);
      }
    }
  }, [project?.id, bentoBoxes, isBoxEmpty]);

  // Funzione per aggiungere una nota (salva nel database)
  // Il listener onSnapshot aggiornerà automaticamente lo stato
  const handleAddNote = async () => {
    if (!project?.id) return;

    try {
      const noteCount =
        bentoBoxes.filter((b) => b.boxType === "note").length + 1;
      await createBentoBox(project.id, {
        title: `Nota ${noteCount}`,
        boxType: "note",
        content: "",
      });
      // Non serve setBentoBoxes - il listener lo farà automaticamente
    } catch (error) {
      console.error("Errore creazione nota:", error);
    }
  };

  // Funzione per aggiungere un PhotoBox
  const handleAddPhoto = async () => {
    if (!project?.id) return;

    try {
      const photoCount =
        bentoBoxes.filter((b) => b.boxType === "photo").length + 1;
      await createBentoBox(project.id, {
        title: `Foto ${photoCount}`,
        boxType: "photo",
        photos: [],
      });
    } catch (error) {
      console.error("Errore creazione photo box:", error);
    }
  };

  // Funzione per aggiungere un FileBox
  const handleAddFile = async () => {
    if (!project?.id) return;

    try {
      const fileCount =
        bentoBoxes.filter((b) => b.boxType === "file").length + 1;
      await createBentoBox(project.id, {
        title: `File ${fileCount}`,
        boxType: "file",
        files: [],
      });
    } catch (error) {
      console.error("Errore creazione file box:", error);
    }
  };

  // Funzione per aggiungere un ChecklistBox
  const handleAddChecklist = async () => {
    if (!project?.id) return;

    try {
      const checklistCount =
        bentoBoxes.filter((b) => b.boxType === "checklist").length + 1;
      await createBentoBox(project.id, {
        title: `Checklist ${checklistCount}`,
        boxType: "checklist",
        checklistItems: [],
      });
    } catch (error) {
      console.error("Errore creazione checklist box:", error);
    }
  };

  // Funzione per aggiungere un AnagraficaBox
  const handleAddAnagrafica = async () => {
    if (!project?.id) return;

    try {
      const anagraficaCount =
        bentoBoxes.filter((b) => b.boxType === "anagrafica").length + 1;
      await createBentoBox(project.id, {
        title: `Anagrafica ${anagraficaCount}`,
        boxType: "anagrafica",
        anagraficaFields: {},
        anagraficaCustomFields: [],
      });
    } catch (error) {
      console.error("Errore creazione anagrafica box:", error);
    }
  };

  // Funzione per aggiungere un PdfBox
  const handleAddPdf = async () => {
    if (!project?.id) return;

    try {
      const pdfCount = bentoBoxes.filter((b) => b.boxType === "pdf").length + 1;
      await createBentoBox(project.id, {
        title: `PDF ${pdfCount}`,
        boxType: "pdf",
        pdfs: [],
      });
    } catch (error) {
      console.error("Errore creazione pdf box:", error);
    }
  };

  // Funzione per gestire la foto dalla fotocamera
  // Crea un nuovo PhotoBox con la foto scattata
  const handleCameraCapture = async (file) => {
    if (!project?.id || !file) return;

    try {
      // 1. Carica la foto su Firebase Storage
      const uploadedPhoto = await uploadPhoto(project.id, file);

      // 2. Crea un nuovo PhotoBox con la foto
      const photoCount =
        bentoBoxes.filter((b) => b.boxType === "photo").length + 1;
      await createBentoBox(project.id, {
        title: `Foto ${photoCount}`,
        boxType: "photo",
        photos: [uploadedPhoto],
      });
    } catch (error) {
      console.error("Errore salvataggio foto dalla fotocamera:", error);
    }
  };

  // Funzione per aggiornare le foto di un PhotoBox
  const handlePhotosChange = async (boxId, newPhotos) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha foto)
      if (newPhotos.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxPhotos(project.id, boxId, newPhotos);
    } catch (error) {
      console.error("Errore aggiornamento foto:", error);
    }
  };

  // Funzione per aggiornare i PDF di un PdfBox
  const handlePdfsChange = async (boxId, newPdfs) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha PDF)
      if (newPdfs.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxPdfs(project.id, boxId, newPdfs);
    } catch (error) {
      console.error("Errore aggiornamento PDF:", error);
    }
  };

  // Funzione per aggiornare i file di un FileBox
  const handleFilesChange = async (boxId, newFiles) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha file)
      if (newFiles.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxFiles(project.id, boxId, newFiles);
    } catch (error) {
      console.error("Errore aggiornamento file:", error);
    }
  };

  // Funzione per aggiornare gli items di un ChecklistBox
  const handleChecklistItemsChange = async (boxId, newItems) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha items)
      if (newItems.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxChecklistItems(project.id, boxId, newItems);
    } catch (error) {
      console.error("Errore aggiornamento checklist:", error);
    }
  };

  // Funzione per aggiornare i campi di un AnagraficaBox
  const handleAnagraficaFieldsChange = async (boxId, newFields) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha campi compilati)
      const hasValues = Object.values(newFields).some((v) => v && v.trim());
      if (hasValues) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxAnagraficaFields(project.id, boxId, newFields);
    } catch (error) {
      console.error("Errore aggiornamento campi anagrafica:", error);
    }
  };

  // Funzione per aggiornare i campi custom di un AnagraficaBox
  const handleAnagraficaCustomFieldsChange = async (boxId, newCustomFields) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha campi custom)
      if (newCustomFields.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxAnagraficaCustomFields(
        project.id,
        boxId,
        newCustomFields
      );
    } catch (error) {
      console.error("Errore aggiornamento campi custom anagrafica:", error);
    }
  };

  // Funzione per eliminare un box (include eliminazione foto/file/pdf dallo storage)
  const handleDeleteBox = async (boxId) => {
    if (!project?.id) return;

    try {
      // Trova il box per verificare se ha foto/file/pdf da eliminare
      const box = bentoBoxes.find((b) => b.id === boxId);
      if (box?.boxType === "photo" && box.photos?.length > 0) {
        // Elimina tutte le foto dallo storage
        await deletePhotos(box.photos.map((p) => p.storagePath));
      }
      if (box?.boxType === "pdf" && box.pdfs?.length > 0) {
        // Elimina tutti i PDF dallo storage
        await deletePdfs(box.pdfs);
      }
      if (box?.boxType === "file" && box.files?.length > 0) {
        // Elimina tutti i file dallo storage
        await deleteFiles(box.files);
      }
      await deleteBentoBox(project.id, boxId);
    } catch (error) {
      console.error("Errore eliminazione bento box:", error);
    }
  };

  // Funzione per aggiornare il titolo di un box (salva nel database)
  const handleBoxTitleChange = async (boxId, newTitle) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato
      modifiedBoxesRef.current.add(boxId);
      await updateBentoBoxTitle(project.id, boxId, newTitle);
    } catch (error) {
      console.error("Errore aggiornamento titolo box:", error);
    }
  };

  // Funzione per aggiornare il contenuto di un box (es. nota)
  // Il listener onSnapshot aggiornerà automaticamente lo stato
  const handleBoxContentChange = async (boxId, newContent) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha contenuto)
      if (newContent && newContent.trim().length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxContent(project.id, boxId, newContent);
      // Non serve setBentoBoxes - il listener lo farà automaticamente
    } catch (error) {
      console.error("Errore aggiornamento contenuto box:", error);
    }
  };

  // Funzione per pinnare/unpinnare un box
  const handleBoxPinToggle = async (boxId, currentPinned) => {
    if (!project?.id) return;

    try {
      const isPinned = !currentPinned;
      const pinnedAt = isPinned ? Date.now() : null;
      await updateBentoBoxPin(project.id, boxId, isPinned, pinnedAt);
      // Il listener onSnapshot aggiornerà automaticamente
    } catch (error) {
      console.error("Errore toggle pin box:", error);
    }
  };

  // I box ordinati: pinnati prima (per pinnedAt), poi gli altri (per createdAt)
  const sortedBoxes = [...bentoBoxes].sort((a, b) => {
    // Se entrambi pinnati, ordina per pinnedAt (prima chi è stato pinnato prima)
    if (a.isPinned && b.isPinned) {
      const pinA = a.pinnedAt?.toDate?.() || new Date(a.pinnedAt || 0);
      const pinB = b.pinnedAt?.toDate?.() || new Date(b.pinnedAt || 0);
      return pinA - pinB;
    }
    // Pinnati prima dei non-pinnati
    if (a.isPinned) return -1;
    if (b.isPinned) return 1;
    // Non-pinnati ordinati per createdAt
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

    // 2. Box utente
    sortedBoxes.forEach((box) => {
      items.push({ ...box, type: "box" });
    });

    // Il FAB flottante è ora usato sia su mobile che desktop,
    // quindi non aggiungiamo più l'add-button alla griglia

    return items;
  }, [sortedBoxes, hasBoxes]);

  // Hook per layout "shortest column first" + animazioni FLIP
  const { containerRef, columns, getItemStyle, flatItems, containerHeight } =
    useBentoAnimation(allItems, columnCount);

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

      // Pulisci i box vuoti e non modificati in background prima di tornare alla home
      cleanupEmptyBoxes();

      // Altrimenti torna alla home
      onBack();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [project, onBack, hasNestedModals, wasPopstateHandled, cleanupEmptyBoxes]);

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
          {/* Padding extra in basso per il FAB flottante (mobile e desktop) */}
          <div
            className="flex justify-center"
            style={{
              paddingTop: columnCount === 1 ? `${GAP}px` : "0",
              paddingBottom: "120px", // Spazio per il FAB flottante
            }}
          >
            {/* Loading */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              /* Griglia con tutti i box - Struttura flat con posizionamento assoluto per mantenere stato componenti */
              <div
                ref={containerRef}
                className={columnCount === 1 ? "w-full" : ""}
                style={{
                  position: "relative",
                  minHeight: containerHeight,
                  width:
                    columnCount === 1
                      ? "100%"
                      : columnCount * BOX_WIDTH + (columnCount - 1) * GAP,
                }}
              >
                {/* Renderizza tutti i box in un contenitore flat usando flatItems */}
                {flatItems.map((item) => {
                  // Calcola la posizione left basandosi sulla colonna
                  const left =
                    columnCount === 1
                      ? 0
                      : item.columnIndex * (BOX_WIDTH + GAP);

                  // Stile per posizionare il box con posizione assoluta
                  const itemStyle = {
                    ...getItemStyle(item.id),
                    position: "absolute",
                    top: item.top,
                    left: left,
                    width: columnCount === 1 ? "100%" : BOX_WIDTH,
                  };

                  // Tutorial box
                  if (item.type === "tutorial") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <TutorialBox isMobile={columnCount === 1} />
                      </div>
                    );
                  }
                  // Render NoteBox per box di tipo "note"
                  if (item.boxType === "note") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <NoteBox
                          title={item.title}
                          content={item.content || ""}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
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
                  // Render PhotoBox per box di tipo "photo"
                  if (item.boxType === "photo") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <PhotoBox
                          projectId={project.id}
                          title={item.title}
                          photos={item.photos || []}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={(newTitle) =>
                            handleBoxTitleChange(item.id, newTitle)
                          }
                          onPhotosChange={(newPhotos) =>
                            handlePhotosChange(item.id, newPhotos)
                          }
                          onDelete={() => handleDeleteBox(item.id)}
                        />
                      </div>
                    );
                  }
                  // Render PdfBox per box di tipo "pdf"
                  if (item.boxType === "pdf") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <PdfBox
                          projectId={project.id}
                          title={item.title}
                          pdfs={item.pdfs || []}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={(newTitle) =>
                            handleBoxTitleChange(item.id, newTitle)
                          }
                          onPdfsChange={(newPdfs) =>
                            handlePdfsChange(item.id, newPdfs)
                          }
                          onDelete={() => handleDeleteBox(item.id)}
                        />
                      </div>
                    );
                  }
                  // Render FileBox per box di tipo "file"
                  if (item.boxType === "file") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <FileBox
                          projectId={project.id}
                          title={item.title}
                          files={item.files || []}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={(newTitle) =>
                            handleBoxTitleChange(item.id, newTitle)
                          }
                          onFilesChange={(newFiles) =>
                            handleFilesChange(item.id, newFiles)
                          }
                          onDelete={() => handleDeleteBox(item.id)}
                        />
                      </div>
                    );
                  }
                  // Render ChecklistBox per box di tipo "checklist"
                  if (item.boxType === "checklist") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <ChecklistBox
                          title={item.title}
                          items={item.checklistItems || []}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={(newTitle) =>
                            handleBoxTitleChange(item.id, newTitle)
                          }
                          onItemsChange={(newItems) =>
                            handleChecklistItemsChange(item.id, newItems)
                          }
                          onDelete={() => handleDeleteBox(item.id)}
                        />
                      </div>
                    );
                  }
                  // Render AnagraficaBox per box di tipo "anagrafica"
                  if (item.boxType === "anagrafica") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={itemStyle}
                      >
                        <AnagraficaBox
                          title={item.title}
                          fields={item.anagraficaFields || {}}
                          customFields={item.anagraficaCustomFields || []}
                          isPinned={item.isPinned || false}
                          onPinToggle={() =>
                            handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={(newTitle) =>
                            handleBoxTitleChange(item.id, newTitle)
                          }
                          onFieldsChange={(newFields) =>
                            handleAnagraficaFieldsChange(item.id, newFields)
                          }
                          onCustomFieldsChange={(newCustomFields) =>
                            handleAnagraficaCustomFieldsChange(
                              item.id,
                              newCustomFields
                            )
                          }
                          onDelete={() => handleDeleteBox(item.id)}
                        />
                      </div>
                    );
                  }
                  // Render BaseBentoBox per box generici (fallback)
                  return (
                    <div
                      key={item.id}
                      data-bento-id={item.id}
                      style={itemStyle}
                    >
                      <BaseBentoBox
                        title={item.title}
                        isPinned={item.isPinned || false}
                        onPinToggle={() =>
                          handleBoxPinToggle(item.id, item.isPinned)
                        }
                        onTitleChange={(newTitle) =>
                          handleBoxTitleChange(item.id, newTitle)
                        }
                        onDelete={() => handleDeleteBox(item.id)}
                      >
                        <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
                          <span className="text-2xl mb-2 opacity-50">📦</span>
                          <span className="text-xs">Box generico</span>
                        </div>
                      </BaseBentoBox>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {/* FAB aggiunta box - mobile */}
        {columnCount === 1 && !isLoading && (
          <MobileAddFab
            onAddNote={handleAddNote}
            onAddPhoto={handleAddPhoto}
            onAddFile={handleAddFile}
            onMoreClick={() => setIsMoreBoxesModalOpen(true)}
          />
        )}

        {/* FAB aggiunta box - desktop */}
        {columnCount > 1 && !isLoading && (
          <DesktopAddFab
            onAddNote={handleAddNote}
            onAddPhoto={handleAddPhoto}
            onAddFile={handleAddFile}
            onMoreClick={() => setIsMoreBoxesModalOpen(true)}
          />
        )}

        {/* FAB fotocamera rapida - solo mobile */}
        {columnCount === 1 && !isLoading && (
          <CameraFab onCapture={handleCameraCapture} />
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

      {/* Modale altri box */}
      <MoreBoxesModal
        isOpen={isMoreBoxesModalOpen}
        onClose={() => setIsMoreBoxesModalOpen(false)}
        onAddChecklist={handleAddChecklist}
        onAddAnagrafica={handleAddAnagrafica}
        onAddPdf={handleAddPdf}
      />
    </>
  );
};

export default ProjectPage;
