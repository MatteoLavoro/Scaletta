import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ArrowLeftIcon,
  InfoIcon,
  SettingsIcon,
  BellIcon,
  MessageSquareIcon,
  LinkIcon,
} from "../components/icons";
import useColumnCount, { BOX_WIDTH, GAP } from "../hooks/useColumnCount";
import useBentoAnimation from "../hooks/useBentoAnimation";
import { useIsMobile } from "../hooks/useIsMobile";
import { useTheme } from "../contexts/ThemeContext";
import { useModal } from "../contexts/ModalContext";
import {
  ProjectInfoModal,
  StatusModal,
  ProjectShareModal,
} from "../components/projects";
import { DropdownMenu } from "../components/ui";
import {
  MobileAddFab,
  DesktopAddFab,
  NoteBox,
  MarkdownBox,
  PhotoBox,
  PdfBox,
  FileBox,
  ChecklistBox,
  AnagraficaBox,
  VersionBox,
  BaseBentoBox,
  TutorialBox,
  CameraFab,
} from "../components/bento";
import { MoreBoxesModal } from "../components/modal";
import { ChatSidebar, ChatFab } from "../components/chat";
import { getProjectColor, DEFAULT_PROJECT_COLOR } from "../utils/projectColors";
import { markProjectAsViewed } from "../utils/projectViews";
import {
  createBentoBox,
  updateBentoBoxTitle,
  updateBentoBoxContent,
  updateBentoBoxNoteContent,
  updateBentoBoxPhotos,
  updateBentoBoxPdfs,
  updateBentoBoxFiles,
  updateBentoBoxChecklistItems,
  updateBentoBoxAnagraficaFields,
  updateBentoBoxAnagraficaCustomFields,
  updateBentoBoxVersions,
  updateBentoBoxPin,
  updateBentoBoxExpanded,
  deleteBentoBox,
  subscribeToBentoBoxes,
  updateBoxesSortOrders,
} from "../services/projects";
import { deletePhotos, uploadPhoto, uploadPhotos } from "../services/photos";
import { deleteFiles, uploadFiles } from "../services/files";
import { deletePdfs, uploadPdfs } from "../services/pdfs";
import {
  markProjectNotificationsAsRead,
  subscribeToUnreadCount,
} from "../services/notifications";

/**
 * ProjectPage - Pagina di un singolo progetto
 *
 * @param {object} project - Dati del progetto
 * @param {object} group - Dati del gruppo
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @param {string} userRole - Ruolo nel progetto: "owner"|"editor"|"viewer"
 * @param {object} currentUser - Dati dell'utente corrente { uid, displayName, email }
 * @param {function} onBack - Callback per tornare indietro
 * @param {function} onUpdateName - Callback per aggiornare il nome del progetto
 * @param {function} onUpdateColor - Callback per aggiornare il colore del progetto
 * @param {function} onUpdateStatus - Callback per aggiornare lo stato del progetto
 * @param {function} onDelete - Callback per eliminare il progetto
 */
const ProjectPage = ({
  project,
  group,
  isFounder,
  userRole = "owner",
  currentUser,
  onBack,
  onUpdateName,
  onUpdateColor,
  onUpdateStatus,
  onDelete,
}) => {
  const hasAddedHistoryRef = useRef(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false);
  const [initialTaggedBoxes, setInitialTaggedBoxes] = useState([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMoreBoxesModalOpen, setIsMoreBoxesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dragCounterRef = useRef(0);

  // Stato drag & drop riordinamento box
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [draggedBoxId, setDraggedBoxId] = useState(null);
  const [dropIndicator, setDropIndicator] = useState(null); // { targetId, before }
  const ghostRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragBoxInfoRef = useRef({
    width: BOX_WIDTH,
    height: 200,
    title: "",
    initialLeft: 0,
    initialTop: 0,
  });
  const dragStateRef = useRef({ hoveredId: null });
  const handleReorderRef = useRef(null);
  const { isDark } = useTheme();
  const { hasNestedModals, wasPopstateHandled } = useModal();

  const isViewer = userRole === "viewer";

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

  // Sottoscrizione al conteggio notifiche non lette
  useEffect(() => {
    if (!project?.id || !currentUser?.uid) return;

    const unsubscribe = subscribeToUnreadCount(
      project.id,
      currentUser.uid,
      (count) => {
        setUnreadCount(count);
      },
    );

    return () => unsubscribe();
  }, [project?.id, currentUser?.uid]);

  // Marca il progetto come visualizzato quando viene aperto
  useEffect(() => {
    if (!project?.id) return;
    markProjectAsViewed(project.id);
  }, [project?.id]);

  // Funzione per verificare se un box è vuoto (nessun contenuto significativo)
  const isBoxEmpty = useCallback((box) => {
    if (box.boxType === "note") {
      return !box.content || box.content.trim().length === 0;
    }
    if (box.boxType === "markdown") {
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
    if (box.boxType === "version") {
      return !box.versions || box.versions.length === 0;
    }
    if (box.boxType === "anagrafica") {
      // Non considerare mai vuoto un box anagrafica
      return false;
    }
    return false; // Non eliminare box di tipo sconosciuto
  }, []);

  // Funzione per pulire i box vuoti e non modificati (chiamata quando si torna alla home)
  const cleanupEmptyBoxes = useCallback(async () => {
    // I viewer non creano box, non c'è nulla da pulire
    if (isViewer) return;
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
        if (box.boxType === "version" && box.versions?.length > 0) {
          await deleteFiles(box.versions);
        }
        await deleteBentoBox(project.id, box.id);
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      });
      // Non serve setBentoBoxes - il listener lo farà automaticamente
    } catch (error) {
      console.error("Errore creazione nota:", error);
    }
  };

  // Funzione per aggiungere un MarkdownBox
  const handleAddMarkdown = async () => {
    if (!project?.id) return;

    try {
      const markdownCount =
        bentoBoxes.filter((b) => b.boxType === "markdown").length + 1;
      await createBentoBox(project.id, {
        title: `Markdown ${markdownCount}`,
        boxType: "markdown",
        content: "",
        contentType: "markdown",
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      });
    } catch (error) {
      console.error("Errore creazione markdown box:", error);
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      });
    } catch (error) {
      console.error("Errore creazione anagrafica box:", error);
    }
  };

  // Funzione per aggiungere un VersionBox
  const handleAddVersion = async () => {
    if (!project?.id) return;

    try {
      const versionCount =
        bentoBoxes.filter((b) => b.boxType === "version").length + 1;
      await createBentoBox(project.id, {
        title: `Controllo Versioni File ${versionCount}`,
        boxType: "version",
        versions: [],
        isExpanded: false, // Default: contratto
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      });
    } catch (error) {
      console.error("Errore creazione version box:", error);
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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      });
    } catch (error) {
      console.error("Errore creazione pdf box:", error);
    }
  };

  // Funzione per classificare i file per tipo
  const classifyFiles = (files) => {
    const photos = [];
    const pdfs = [];
    const others = [];

    files.forEach((file) => {
      // Foto (immagini)
      if (file.type.startsWith("image/")) {
        photos.push(file);
      }
      // PDF
      else if (file.type === "application/pdf") {
        pdfs.push(file);
      }
      // Altri file
      else {
        others.push(file);
      }
    });

    return { photos, pdfs, others };
  };

  // Gestisce il drop dei file - crea automaticamente le box per tipo
  const handleFileDrop = async (files) => {
    if (!project?.id || files.length === 0) return;

    // Classifica i file per tipo
    const { photos, pdfs, others } = classifyFiles(files);

    // Upload in background - non blocca l'interfaccia
    // Upload foto e crea PhotoBox
    if (photos.length > 0) {
      // Crea subito il box vuoto con stato caricamento
      const photoCount =
        bentoBoxes.filter((b) => b.boxType === "photo").length + 1;
      createBentoBox(project.id, {
        title: `Foto ${photoCount}`,
        boxType: "photo",
        photos: [],
        isUploading: true,
        uploadProgress: 0,
        uploadTotal: photos.length,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      })
        .then((box) => {
          if (box?.id) {
            modifiedBoxesRef.current.add(box.id);
            // Avvia upload con callback per progresso
            return uploadPhotos(project.id, photos, (progress) => {
              // Aggiorna progresso nel box
              updateBentoBoxContent(
                project.id,
                box.id,
                `uploading:${progress}`,
              );
            }).then((uploadedPhotos) => ({ boxId: box.id, uploadedPhotos }));
          }
        })
        .then((result) => {
          if (result?.uploadedPhotos && result.uploadedPhotos.length > 0) {
            // Aggiorna il box con le foto caricate
            return updateBentoBoxPhotos(
              project.id,
              result.boxId,
              result.uploadedPhotos,
              currentUser?.uid,
              currentUser?.displayName || currentUser?.email,
            );
          }
        })
        .catch((error) => {
          console.error("Errore upload foto tramite drag & drop:", error);
        });
    }

    // Upload PDF e crea PdfBox
    if (pdfs.length > 0) {
      // Crea subito il box vuoto con stato caricamento
      const pdfCount = bentoBoxes.filter((b) => b.boxType === "pdf").length + 1;
      createBentoBox(project.id, {
        title: `PDF ${pdfCount}`,
        boxType: "pdf",
        pdfs: [],
        isUploading: true,
        uploadProgress: 0,
        uploadTotal: pdfs.length,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      })
        .then((box) => {
          if (box?.id) {
            modifiedBoxesRef.current.add(box.id);
            // Avvia upload con callback per progresso
            return uploadPdfs(project.id, pdfs, (progress) => {
              // Aggiorna progresso nel box
              updateBentoBoxContent(
                project.id,
                box.id,
                `uploading:${progress}`,
              );
            }).then((uploadedPdfs) => ({ boxId: box.id, uploadedPdfs }));
          }
        })
        .then((result) => {
          if (result?.uploadedPdfs && result.uploadedPdfs.length > 0) {
            // Aggiorna il box con i PDF caricati
            return updateBentoBoxPdfs(
              project.id,
              result.boxId,
              result.uploadedPdfs,
              currentUser?.uid,
              currentUser?.displayName || currentUser?.email,
            );
          }
        })
        .catch((error) => {
          console.error("Errore upload PDF tramite drag & drop:", error);
        });
    }

    // Upload altri file e crea FileBox
    if (others.length > 0) {
      // Crea subito il box vuoto con stato caricamento
      const fileCount =
        bentoBoxes.filter((b) => b.boxType === "file").length + 1;
      createBentoBox(project.id, {
        title: `File ${fileCount}`,
        boxType: "file",
        files: [],
        isUploading: true,
        uploadProgress: 0,
        uploadTotal: others.length,
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
      })
        .then((box) => {
          if (box?.id) {
            modifiedBoxesRef.current.add(box.id);
            // Avvia upload con callback per progresso
            return uploadFiles(project.id, others, (progress) => {
              // Aggiorna progresso nel box
              updateBentoBoxContent(
                project.id,
                box.id,
                `uploading:${progress}`,
              );
            }).then((uploadedFiles) => ({ boxId: box.id, uploadedFiles }));
          }
        })
        .then((result) => {
          if (result?.uploadedFiles && result.uploadedFiles.length > 0) {
            // Aggiorna il box con i file caricati
            return updateBentoBoxFiles(
              project.id,
              result.boxId,
              result.uploadedFiles,
              currentUser?.uid,
              currentUser?.displayName || currentUser?.email,
            );
          }
        })
        .catch((error) => {
          console.error("Errore upload file tramite drag & drop:", error);
        });
    }
  };

  // Gestisce l'evento dragenter
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // I viewer non possono fare upload
    if (isViewer) return;

    // Ignora il drag se ci sono modali aperti
    if (
      hasNestedModals() ||
      isInfoModalOpen ||
      isStatusModalOpen ||
      isMoreBoxesModalOpen
    ) {
      return;
    }

    dragCounterRef.current++;

    // Verifica che ci siano file nel drag
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        (item) => item.kind === "file",
      );
      if (hasFiles) {
        setIsDraggingFiles(true);
      }
    }
  };

  // Gestisce l'evento dragleave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDraggingFiles(false);
    }
  };

  // Gestisce l'evento dragover
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Gestisce l'evento drop
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingFiles(false);
    dragCounterRef.current = 0;

    // Ignora il drop se ci sono modali aperti
    if (
      hasNestedModals() ||
      isInfoModalOpen ||
      isStatusModalOpen ||
      isMoreBoxesModalOpen
    ) {
      return;
    }

    // Estrai i file dal drop
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileDrop(files);
    }
  };

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
        createdBy: currentUser?.uid,
        createdByName: currentUser?.displayName || currentUser?.email,
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
      await updateBentoBoxPhotos(
        project.id,
        boxId,
        newPhotos,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
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
      await updateBentoBoxPdfs(
        project.id,
        boxId,
        newPdfs,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
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
      await updateBentoBoxFiles(
        project.id,
        boxId,
        newFiles,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
    } catch (error) {
      console.error("Errore aggiornamento file:", error);
    }
  };

  // Funzione per aggiornare le versioni di un VersionBox
  const handleVersionsChange = async (boxId, newVersions) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha versioni)
      if (newVersions.length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxVersions(
        project.id,
        boxId,
        newVersions,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
    } catch (error) {
      console.error("Errore aggiornamento versioni:", error);
    }
  };

  // Funzione per aggiornare lo stato isExpanded di un VersionBox
  const handleVersionBoxExpandedChange = async (boxId, isExpanded) => {
    if (!project?.id) return;

    try {
      await updateBentoBoxExpanded(project.id, boxId, isExpanded);
      // Il listener onSnapshot aggiornerà automaticamente lo stato
    } catch (error) {
      console.error("Errore aggiornamento stato expanded:", error);
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
      await updateBentoBoxChecklistItems(
        project.id,
        boxId,
        newItems,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
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
      await updateBentoBoxAnagraficaFields(
        project.id,
        boxId,
        newFields,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
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
        newCustomFields,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
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

      // Rimuovi il box dal Set dei modificati (se presente)
      modifiedBoxesRef.current.delete(boxId);

      // Elimina le foto dallo storage se presenti
      if (box?.photos && box.photos.length > 0) {
        await deletePhotos(box.photos);
      }

      // Elimina i PDF dallo storage se presenti
      if (box?.pdfs && box.pdfs.length > 0) {
        await deletePdfs(box.pdfs);
      }

      // Elimina i file dallo storage se presenti
      if (box?.files && box.files.length > 0) {
        await deleteFiles(box.files);
      }

      // Elimina il box da Firestore
      await deleteBentoBox(
        project.id,
        boxId,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
    } catch (error) {
      console.error("Errore eliminazione box:", error);
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
  const handleBoxContentChange = async (
    boxId,
    newContent,
    newContentType = "txt",
  ) => {
    if (!project?.id) return;

    try {
      // Segna il box come modificato (se ha contenuto)
      if (newContent && newContent.trim().length > 0) {
        modifiedBoxesRef.current.add(boxId);
      }
      await updateBentoBoxNoteContent(
        project.id,
        boxId,
        newContent,
        newContentType,
        currentUser?.uid,
        currentUser?.displayName || currentUser?.email,
      );
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

  // ── Drag & Drop riordinamento box ──────────────────────────────────────────

  // Box ordinati: pinnati prima (per pinnedAt), poi per sortOrder esplicito, poi per createdAt
  const sortedBoxes = useMemo(() => {
    return [...bentoBoxes].sort((a, b) => {
      if (a.isPinned && b.isPinned) {
        const pinA = a.pinnedAt?.toDate?.() || new Date(a.pinnedAt || 0);
        const pinB = b.pinnedAt?.toDate?.() || new Date(b.pinnedAt || 0);
        return pinA - pinB;
      }
      if (a.isPinned) return -1;
      if (b.isPinned) return 1;
      if (a.sortOrder != null && b.sortOrder != null)
        return a.sortOrder - b.sortOrder;
      if (a.sortOrder != null) return -1;
      if (b.sortOrder != null) return 1;
      const dateA = a.createdAt?.toDate?.() || null;
      const dateB = b.createdAt?.toDate?.() || null;
      if (dateA && dateB) return dateA - dateB;
      if (!dateA && dateB) return 1;
      if (dateA && !dateB) return -1;
      return 0;
    });
  }, [bentoBoxes]);

  // Avvia il drag: salva info box, imposta stato
  const handleDragStart = useCallback((boxId, boxTitle, originalEvent) => {
    const boxEl = containerRef.current?.querySelector(
      `[data-bento-id="${boxId}"]`,
    );
    if (!boxEl) return;

    const rect = boxEl.getBoundingClientRect();
    const offsetX = originalEvent.clientX - rect.left;
    const offsetY = originalEvent.clientY - rect.top;

    dragOffsetRef.current = { x: offsetX, y: offsetY };
    dragBoxInfoRef.current = {
      width: rect.width,
      height: rect.height,
      title: boxTitle,
      initialLeft: originalEvent.clientX - offsetX,
      initialTop: originalEvent.clientY - offsetY,
    };
    dragStateRef.current = { hoveredId: null };

    setIsDraggingBox(true);
    setDraggedBoxId(boxId);
    setDropIndicator(null);
  }, []);

  // Gestisce il pointerdown sul wrapper del box: rileva la soglia di movimento prima di avviare il drag
  const handleWrapperPointerDown = useCallback(
    (item, e) => {
      if (isViewer || item.isPinned || item.type === "tutorial") return;
      if (e.button !== undefined && e.button !== 0) return; // solo tasto sinistro
      if (!e.target.closest("[data-drag-handle]")) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const DRAG_THRESHOLD = 8;
      let dragInitiated = false;

      const onMove = (moveEvent) => {
        if (dragInitiated) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          dragInitiated = true;
          cleanup();
          // Intercetta il prossimo click in capture-phase per non aprire il modal titolo
          document.addEventListener("click", cancelClick, {
            capture: true,
            once: true,
          });
          handleDragStart(item.id, item.title, e);
        }
      };

      const onUp = () => cleanup();
      const cancelClick = (ce) => ce.stopPropagation();

      const cleanup = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [isViewer, handleDragStart],
  );

  // Scambia la posizione di due box non-pinnati
  const handleReorderBoxes = useCallback(
    async (dragId, targetId) => {
      if (!project?.id || dragId === targetId) return;

      const nonPinned = sortedBoxes.filter((b) => !b.isPinned);
      if (nonPinned.length < 2) return;

      const draggedIdx = nonPinned.findIndex((b) => b.id === dragId);
      const targetIdx = nonPinned.findIndex((b) => b.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return;

      // Assegna sortOrder esplicito a tutti, poi scambia i due
      const updates = nonPinned.map((box, idx) => {
        if (box.id === dragId) return { boxId: box.id, sortOrder: targetIdx };
        if (box.id === targetId)
          return { boxId: box.id, sortOrder: draggedIdx };
        return { boxId: box.id, sortOrder: idx };
      });

      try {
        await updateBoxesSortOrders(project.id, updates);
      } catch (error) {
        console.error("Errore scambio box:", error);
      }
    },
    [project?.id, sortedBoxes],
  );

  // Mantieni handleReorderRef sempre aggiornato (evita closure stale nell'effect)
  useEffect(() => {
    handleReorderRef.current = handleReorderBoxes;
  }, [handleReorderBoxes]);

  // Gestori globali di pointer durante il drag
  useEffect(() => {
    if (!isDraggingBox) return;

    const onMove = (e) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX - dragOffsetRef.current.x}px`;
        ghostRef.current.style.top = `${e.clientY - dragOffsetRef.current.y}px`;
      }

      let newHoveredId = null;

      if (containerRef.current) {
        const elements =
          containerRef.current.querySelectorAll("[data-bento-id]");
        for (const el of elements) {
          const bId = el.getAttribute("data-bento-id");
          if (bId === draggedBoxId || bId === "tutorial") continue;
          const rect = el.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            newHoveredId = bId;
            break;
          }
        }
      }

      if (newHoveredId !== dragStateRef.current.hoveredId) {
        dragStateRef.current = { hoveredId: newHoveredId };
        setDropIndicator(newHoveredId ? { targetId: newHoveredId } : null);
      }
    };

    const onUp = () => {
      const { hoveredId } = dragStateRef.current;
      if (hoveredId && hoveredId !== draggedBoxId) {
        handleReorderRef.current?.(draggedBoxId, hoveredId);
      }
      setIsDraggingBox(false);
      setDraggedBoxId(null);
      setDropIndicator(null);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [isDraggingBox, draggedBoxId]);

  // Classe CSS grabbing sul body durante il drag
  useEffect(() => {
    if (!isDraggingBox) return;
    document.body.classList.add("is-dragging-box");
    return () => document.body.classList.remove("is-dragging-box");
  }, [isDraggingBox]);

  // Numero di colonne dinamico (si aggiorna al resize)
  const columnCount = useColumnCount(isChatSidebarOpen, 340);

  // Flag per determinare se è veramente mobile (basato sulla viewport, non sul columnCount)
  // Solo viewport < 640px è considerata mobile
  const isReallyMobile = useIsMobile(640);

  // Se non ci sono box, mostra il tutorial
  const hasBoxes = sortedBoxes.length > 0;

  // Array di tutti gli items per distribuzione
  const allItems = useMemo(() => {
    if (isLoading) return []; // Mentre carica prevIds resta vuoto, nessun flash di visibilità
    const items = [];
    if (!hasBoxes) {
      items.push({ id: "tutorial", type: "tutorial" });
    }
    sortedBoxes.forEach((box) => {
      items.push({ ...box, type: "box" });
    });
    return items;
  }, [sortedBoxes, hasBoxes, isLoading]);

  // Hook per layout "shortest column first" + animazioni FLIP
  const { containerRef, getItemStyle, flatItems, containerHeight } =
    useBentoAnimation(allItems, columnCount);

  // Ottieni il colore del progetto
  const projectColor = getProjectColor(
    project?.color || DEFAULT_PROJECT_COLOR,
    isDark,
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
        "",
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

  // Blocca lo scroll della pagina quando la chat è aperta su mobile
  useEffect(() => {
    if (isChatSidebarOpen && isReallyMobile) {
      // Salva lo scroll corrente
      const scrollY = window.scrollY;
      // Blocca lo scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Ripristina lo scroll
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isChatSidebarOpen, isReallyMobile]);

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

  // Handler per apertura chat sidebar - marca notifiche come lette
  const handleOpenNotifications = async () => {
    setIsChatSidebarOpen(true);

    // Marca le notifiche come lette quando si apre
    if (project?.id && currentUser?.uid) {
      await markProjectNotificationsAsRead(project.id, currentUser.uid);
    }
  };

  // Handler per chiusura chat sidebar
  const handleCloseChatSidebar = () => {
    setIsChatSidebarOpen(false);
    setInitialTaggedBoxes([]); // Reset box taggati
  };

  // Apri chat con un box già taggato (dal kebab menu del box)
  const handleSendMessageFromBox = useCallback((boxId, boxTitle, boxType) => {
    // Imposta il box come taggato inizialmente (con title per fallback se eliminato)
    setInitialTaggedBoxes([{ id: boxId, boxType, title: boxTitle }]);
    // Apri la chat
    setIsChatSidebarOpen(true);
  }, []);

  // Evidenzia un box con animazione (chiamato dal click su etichetta in chat)
  const handleHighlightBox = useCallback((boxId) => {
    // Trova il box nel DOM usando data-bento-id
    const boxElement = document.querySelector(`[data-bento-id="${boxId}"]`);
    if (!boxElement) return;

    // Scrolla fino al box
    boxElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Applica animazione di evidenziazione
    boxElement.classList.add("box-highlight-animation");

    // Rimuovi l'animazione dopo che finisce
    setTimeout(() => {
      boxElement.classList.remove("box-highlight-animation");
    }, 2000);
  }, []);

  // Costruisci il menu kebab in base al ruolo
  const menuItems = [
    {
      label: "Info progetto",
      icon: <InfoIcon className="w-5 h-5" />,
      onClick: () => setIsInfoModalOpen(true),
    },
    ...(!isViewer
      ? [
          { separator: true },
          {
            label: "Gestisci stato",
            icon: <SettingsIcon className="w-5 h-5" />,
            onClick: () => setIsStatusModalOpen(true),
          },
        ]
      : []),
    ...(userRole === "owner"
      ? [
          { separator: true },
          {
            label: "Gestione condivisione",
            icon: <LinkIcon className="w-5 h-5" />,
            onClick: () => setIsShareModalOpen(true),
          },
        ]
      : []),
  ];

  if (!project) return null;

  return (
    <>
      <div className="min-h-dvh flex flex-col bg-bg-primary">
        {/* Header - stile standard con colore progetto */}
        <header
          className="flex items-center justify-between px-4 min-h-14 border-b border-border sticky top-0 z-60"
          style={{
            backgroundColor: projectColor.bg,
            paddingTop: `calc(0.75rem + var(--safe-area-inset-top))`,
            paddingBottom: "0.75rem",
          }}
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

          {/* Kebab menu - Destra */}
          <div className="flex items-center gap-2">
            {/* Tasto Chat - solo mobile */}
            {isReallyMobile && (
              <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center relative">
                <button
                  onClick={
                    isChatSidebarOpen
                      ? handleCloseChatSidebar
                      : handleOpenNotifications
                  }
                  className="
                    flex items-center justify-center w-full h-full
                    rounded-full
                    hover:bg-black/10 active:bg-black/20
                    transition-colors duration-150
                  "
                  style={{ color: projectColor.text }}
                  aria-label={isChatSidebarOpen ? "Chiudi chat" : "Apri chat"}
                >
                  <MessageSquareIcon className="w-5 h-5" />
                </button>
                {/* Badge messaggi non letti */}
                {!isChatSidebarOpen && unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Kebab menu dropdown con cerchietto */}
            <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
              <DropdownMenu
                items={menuItems}
                buttonColor={projectColor.text}
                ariaLabel="Menu progetto"
                compact
              />
            </div>
          </div>
        </header>

        {/* Contenuto principale - Bento Grid */}
        <main
          className={`flex-1 ${columnCount === 1 ? "px-2" : "p-4"} relative transition-all duration-300`}
          style={{
            marginRight: isChatSidebarOpen && !isReallyMobile ? "340px" : "0",
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Overlay drag & drop - occupa tutto lo spazio con margini */}
          {isDraggingFiles && (
            <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
              <div className="w-full h-full border-4 border-dashed border-primary rounded-2xl flex flex-col items-center justify-center gap-4 bg-bg-primary/95 backdrop-blur-sm pointer-events-none">
                <svg
                  className="w-16 h-16 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-xl font-semibold text-text-primary mb-1">
                    Rilascia i file qui
                  </p>
                  <p className="text-sm text-text-muted">
                    Verranno automaticamente divisi per tipo
                  </p>
                </div>
              </div>
            </div>
          )}

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

                  // Variabili per drag & drop
                  const isHole = isDraggingBox && draggedBoxId === item.id;
                  const isDropTarget = dropIndicator?.targetId === item.id;
                  const isDraggable =
                    !isViewer && !item.isPinned && item.type !== "tutorial";

                  // Stile wrapper unificato (include effetto "buco" durante il drag)
                  const wrapperStyle = {
                    ...getItemStyle(item.id),
                    position: "absolute",
                    top: item.top,
                    left: left,
                    width: columnCount === 1 ? "100%" : BOX_WIDTH,
                    ...(isHole ? { opacity: 0.08, pointerEvents: "none" } : {}),
                  };

                  // Indicatore di swap (ring attorno al box target)
                  const dropLine = isDropTarget ? (
                    <div
                      className="absolute z-30 pointer-events-none rounded-xl"
                      style={{
                        inset: "-3px",
                        boxShadow: "0 0 0 3px var(--color-primary)",
                      }}
                    />
                  ) : null;

                  // Tutorial box (non draggabile)
                  if (item.type === "tutorial") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        style={wrapperStyle}
                      >
                        <TutorialBox isMobile={isReallyMobile} />
                      </div>
                    );
                  }
                  // Render NoteBox per box di tipo "note"
                  if (item.boxType === "note") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <NoteBox
                          title={item.title}
                          content={item.content || ""}
                          isPinned={item.isPinned || false}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onContentChange={
                            isViewer
                              ? undefined
                              : (newContent, newContentType) =>
                                  handleBoxContentChange(
                                    item.id,
                                    newContent,
                                    newContentType,
                                  )
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render MarkdownBox per box di tipo "markdown"
                  if (item.boxType === "markdown") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <MarkdownBox
                          title={item.title}
                          content={item.content || ""}
                          isPinned={item.isPinned || false}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onContentChange={
                            isViewer
                              ? undefined
                              : (newContent, newContentType) =>
                                  handleBoxContentChange(
                                    item.id,
                                    newContent,
                                    newContentType,
                                  )
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render PhotoBox per box di tipo "photo"
                  if (item.boxType === "photo") {
                    // Estrai progresso da content se sta caricando
                    const uploadProgressMatch =
                      item.content?.match(/^uploading:(\d+)$/);
                    const uploadProgress = uploadProgressMatch
                      ? parseInt(uploadProgressMatch[1])
                      : 0;

                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <PhotoBox
                          projectId={project.id}
                          title={item.title}
                          photos={item.photos || []}
                          isPinned={item.isPinned || false}
                          isUploading={item.isUploading || false}
                          uploadProgress={uploadProgress}
                          uploadTotal={item.uploadTotal || 0}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onPhotosChange={
                            isViewer
                              ? undefined
                              : (newPhotos) =>
                                  handlePhotosChange(item.id, newPhotos)
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render PdfBox per box di tipo "pdf"
                  if (item.boxType === "pdf") {
                    // Estrai progresso da content se sta caricando
                    const uploadProgressMatch =
                      item.content?.match(/^uploading:(\d+)$/);
                    const uploadProgress = uploadProgressMatch
                      ? parseInt(uploadProgressMatch[1])
                      : 0;

                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <PdfBox
                          projectId={project.id}
                          title={item.title}
                          pdfs={item.pdfs || []}
                          isPinned={item.isPinned || false}
                          isUploading={item.isUploading || false}
                          uploadProgress={uploadProgress}
                          uploadTotal={item.uploadTotal || 0}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onPdfsChange={
                            isViewer
                              ? undefined
                              : (newPdfs) => handlePdfsChange(item.id, newPdfs)
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render FileBox per box di tipo "file"
                  if (item.boxType === "file") {
                    // Estrai progresso da content se sta caricando
                    const uploadProgressMatch =
                      item.content?.match(/^uploading:(\d+)$/);
                    const uploadProgress = uploadProgressMatch
                      ? parseInt(uploadProgressMatch[1])
                      : 0;

                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <FileBox
                          projectId={project.id}
                          title={item.title}
                          files={item.files || []}
                          isPinned={item.isPinned || false}
                          isUploading={item.isUploading || false}
                          uploadProgress={uploadProgress}
                          uploadTotal={item.uploadTotal || 0}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onFilesChange={
                            isViewer
                              ? undefined
                              : (newFiles) =>
                                  handleFilesChange(item.id, newFiles)
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
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
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <ChecklistBox
                          title={item.title}
                          items={item.checklistItems || []}
                          isPinned={item.isPinned || false}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onItemsChange={
                            isViewer
                              ? undefined
                              : (newItems) =>
                                  handleChecklistItemsChange(item.id, newItems)
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
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
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <AnagraficaBox
                          title={item.title}
                          fields={item.anagraficaFields || {}}
                          customFields={item.anagraficaCustomFields || []}
                          isPinned={item.isPinned || false}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onFieldsChange={
                            isViewer
                              ? undefined
                              : (newFields) =>
                                  handleAnagraficaFieldsChange(
                                    item.id,
                                    newFields,
                                  )
                          }
                          onCustomFieldsChange={
                            isViewer
                              ? undefined
                              : (newCustomFields) =>
                                  handleAnagraficaCustomFieldsChange(
                                    item.id,
                                    newCustomFields,
                                  )
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render VersionBox per box di tipo "version"
                  if (item.boxType === "version") {
                    return (
                      <div
                        key={item.id}
                        data-bento-id={item.id}
                        data-draggable={isDraggable ? "true" : undefined}
                        style={wrapperStyle}
                        onPointerDown={
                          isDraggable
                            ? (e) => handleWrapperPointerDown(item, e)
                            : undefined
                        }
                      >
                        {dropLine}
                        <VersionBox
                          projectId={project.id}
                          boxId={item.id}
                          title={item.title}
                          versions={item.versions || []}
                          isPinned={item.isPinned || false}
                          isExpanded={item.isExpanded || false}
                          createdByName={item.createdByName}
                          createdAt={item.createdAt}
                          isViewer={isViewer}
                          onPinToggle={
                            isViewer
                              ? undefined
                              : () => handleBoxPinToggle(item.id, item.isPinned)
                          }
                          onTitleChange={
                            isViewer
                              ? undefined
                              : (newTitle) =>
                                  handleBoxTitleChange(item.id, newTitle)
                          }
                          onVersionsChange={
                            isViewer
                              ? undefined
                              : (newVersions) =>
                                  handleVersionsChange(item.id, newVersions)
                          }
                          onExpandedChange={(newExpanded) =>
                            handleVersionBoxExpandedChange(item.id, newExpanded)
                          }
                          onDelete={
                            isViewer
                              ? undefined
                              : () => handleDeleteBox(item.id)
                          }
                          onSendMessageFromBox={() =>
                            handleSendMessageFromBox(
                              item.id,
                              item.title,
                              item.boxType,
                            )
                          }
                        />
                      </div>
                    );
                  }
                  // Render BaseBentoBox per box generici (fallback)
                  return (
                    <div
                      key={item.id}
                      data-bento-id={item.id}
                      data-draggable={isDraggable ? "true" : undefined}
                      style={wrapperStyle}
                      onPointerDown={
                        isDraggable
                          ? (e) => handleWrapperPointerDown(item, e)
                          : undefined
                      }
                    >
                      {dropLine}
                      <BaseBentoBox
                        title={item.title}
                        isPinned={item.isPinned || false}
                        createdByName={item.createdByName}
                        createdAt={item.createdAt}
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

        {/* Ghost box che segue il cursore durante il drag */}
        {isDraggingBox && (
          <div
            ref={ghostRef}
            className="fixed pointer-events-none z-150"
            style={{
              left: `${dragBoxInfoRef.current.initialLeft}px`,
              top: `${dragBoxInfoRef.current.initialTop}px`,
              width: `${dragBoxInfoRef.current.width}px`,
              willChange: "left, top",
              transform: "rotate(1.5deg) scale(1.02)",
              transformOrigin: "center top",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
              borderRadius: "12px",
              overflow: "hidden",
              opacity: 0.88,
            }}
          >
            <div
              className="border border-border rounded-xl bg-bg-secondary flex flex-col"
              style={{ height: `${dragBoxInfoRef.current.height}px` }}
            >
              {/* Header che replica BaseBentoBox */}
              <div className="flex items-center justify-between px-2 py-1.5 shrink-0">
                <div className="w-7 h-7 rounded-full bg-bg-tertiary opacity-40" />
                <div className="flex-1 flex items-center justify-center px-1 min-w-0">
                  <div className="px-2.5 py-0.5 rounded-full bg-bg-tertiary max-w-full">
                    <span className="text-xs font-semibold text-text-primary truncate block">
                      {dragBoxInfoRef.current.title}
                    </span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-bg-tertiary opacity-40" />
              </div>
              {/* Divider */}
              <div className="h-px shrink-0 mx-2 bg-border" />
              {/* Area contenuto */}
              <div className="flex-1 m-3 rounded-lg bg-bg-tertiary/25" />
            </div>
          </div>
        )}

        {/* FAB aggiunta box - mobile (nascosti per viewer) */}
        {isReallyMobile && !isLoading && !isViewer && (
          <div className={isDraggingFiles ? "-z-10" : ""}>
            <MobileAddFab
              onAddNote={handleAddNote}
              onAddPhoto={handleAddPhoto}
              onAddFile={handleAddFile}
              onMoreClick={() => setIsMoreBoxesModalOpen(true)}
            />
          </div>
        )}

        {/* FAB aggiunta box - desktop (nascosti per viewer) */}
        {!isReallyMobile && !isLoading && !isViewer && (
          <div
            className={isDraggingFiles ? "-z-10" : ""}
            style={{
              marginRight: isChatSidebarOpen ? "340px" : "0",
              transition: "margin-right 300ms ease-in-out",
            }}
          >
            <DesktopAddFab
              onAddNote={handleAddNote}
              onAddPhoto={handleAddPhoto}
              onAddFile={handleAddFile}
              onMoreClick={() => setIsMoreBoxesModalOpen(true)}
            />
          </div>
        )}

        {/* FAB fotocamera rapida - solo mobile, nascosto per viewer */}
        {isReallyMobile && !isLoading && !isChatSidebarOpen && !isViewer && (
          <div className={isDraggingFiles ? "-z-10" : ""}>
            <CameraFab onCapture={handleCameraCapture} />
          </div>
        )}
      </div>

      {/* Modale info progetto */}
      <ProjectInfoModal
        isOpen={isInfoModalOpen}
        project={project}
        isFounder={isFounder}
        isOwner={userRole === "owner"}
        onClose={() => setIsInfoModalOpen(false)}
        onUpdateName={onUpdateName}
        onUpdateColor={onUpdateColor}
      />

      {/* Modale gestione stato */}
      <StatusModal
        isOpen={isStatusModalOpen}
        project={project}
        isFounder={userRole === "owner" ? isFounder : false}
        currentUserId={userRole === "owner" ? currentUser?.uid : null}
        onClose={() => setIsStatusModalOpen(false)}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      {/* Modale gestione condivisione - solo owner */}
      {userRole === "owner" && (
        <ProjectShareModal
          isOpen={isShareModalOpen}
          project={project}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Modale altri box */}
      <MoreBoxesModal
        isOpen={isMoreBoxesModalOpen}
        onClose={() => setIsMoreBoxesModalOpen(false)}
        onAddChecklist={handleAddChecklist}
        onAddAnagrafica={handleAddAnagrafica}
        onAddPdf={handleAddPdf}
        onAddVersion={handleAddVersion}
        onAddMarkdown={handleAddMarkdown}
      />

      {/* Chat Sidebar - per tutti i dispositivi */}
      <ChatSidebar
        isOpen={isChatSidebarOpen}
        onClose={handleCloseChatSidebar}
        project={project}
        group={group}
        bentoBoxes={bentoBoxes}
        initialTaggedBoxes={initialTaggedBoxes}
        onHighlightBox={handleHighlightBox}
        isMobile={isReallyMobile}
        isBoxEmpty={isBoxEmpty}
        modifiedBoxesRef={modifiedBoxesRef}
      />

      {/* Chat FAB - solo desktop (su mobile è nell'header) */}
      {!isReallyMobile && (
        <ChatFab
          onClick={
            isChatSidebarOpen ? handleCloseChatSidebar : handleOpenNotifications
          }
          unreadCount={unreadCount}
          isMobile={false}
          isOpen={isChatSidebarOpen}
        />
      )}
    </>
  );
};

export default ProjectPage;
