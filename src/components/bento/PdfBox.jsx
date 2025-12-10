import { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  TrashIcon,
} from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { PdfUploadModal } from "../modal";
import { ConfirmModal } from "../modal";
import { uploadPdfs, deletePdf } from "../../services/pdfs";

// Configura il worker per react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Altezza fissa del carosello (stessa del PhotoBox)
const CAROUSEL_HEIGHT = 200;

/**
 * PdfThumbnail - Anteprima di un singolo PDF
 */
const PdfThumbnail = ({ pdf, containerWidth }) => {
  const [numPages, setNumPages] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onDocumentLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Errore caricamento PDF:", error);
    setHasError(true);
  }, []);

  const onPageRenderSuccess = useCallback(() => {
    setIsLoaded(true);
  }, []);

  // Calcola la larghezza ottimale della pagina
  const pageWidth = containerWidth ? containerWidth - 16 : 280;

  const handleClick = () => {
    if (pdf?.url) {
      window.open(pdf.url, "_blank");
    }
  };

  // Se non c'è un URL valido, mostra placeholder
  if (!pdf?.url) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg">
        <FileTextIcon className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-xs text-gray-500">PDF non disponibile</span>
      </div>
    );
  }

  // Se c'è un errore, mostra il fallback
  if (hasError) {
    return (
      <div
        className="relative w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/20 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
        onClick={handleClick}
      >
        <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center mb-2">
          <FileTextIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-text-primary truncate max-w-[90%] px-2">
          {pdf?.name || "PDF"}
        </p>
        <p className="text-xs text-text-muted mt-1">Tocca per aprire</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-white rounded-lg overflow-hidden cursor-pointer"
      onClick={handleClick}
    >
      <Document
        key={pdf.id || pdf.url}
        file={pdf.url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div className="flex items-center justify-center w-full h-full">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          </div>
        }
        error={null} // Gestiamo l'errore con onLoadError
      >
        {numPages !== null && (
          <Page
            pageNumber={1}
            width={pageWidth}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onRenderSuccess={onPageRenderSuccess}
            loading={
              <div className="flex items-center justify-center w-full h-full">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              </div>
            }
          />
        )}
      </Document>

      {/* Indicatore pagine multiple */}
      {isLoaded && numPages && numPages > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/70 rounded-full">
          <span className="text-xs text-white font-medium">
            +{numPages - 1} pagin{numPages - 1 === 1 ? "a" : "e"}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * PdfBox - Bento Box per i PDF
 *
 * Box specializzato per contenere uno o più PDF.
 * Ha un carosello per scorrere tra i PDF.
 * Mostra solo la prima pagina con indicatore se ci sono più pagine.
 *
 * @param {string} projectId - ID del progetto (per upload)
 * @param {string} title - Titolo del box
 * @param {array} pdfs - Array di PDF { id, url, name, storagePath, pageCount }
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onPdfsChange - Callback quando cambiano i PDF
 * @param {function} onDelete - Callback per eliminare il box
 */
const PdfBox = ({
  projectId,
  title = "PDF",
  pdfs = [],
  isPinned = false,
  onPinToggle,
  onTitleChange,
  onPdfsChange,
  onDelete,
}) => {
  // Stato locale per i PDF (sincronizzato con props)
  const [localPdfs, setLocalPdfs] = useState(pdfs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  // Upload in background direttamente nel box
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Sincronizza stato locale con props
  useEffect(() => {
    setLocalPdfs(pdfs);
  }, [pdfs]);
  const [isDeletePdfConfirmOpen, setIsDeletePdfConfirmOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);

  // Ref per misurare la larghezza del container
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Touch/swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Misura la larghezza del container
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Mantieni l'indice valido quando cambiano i PDF
  useEffect(() => {
    if (currentIndex >= localPdfs.length && localPdfs.length > 0) {
      setCurrentIndex(localPdfs.length - 1);
    }
  }, [localPdfs.length, currentIndex]);

  // Navigazione carosello
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : localPdfs.length - 1));
  }, [localPdfs.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < localPdfs.length - 1 ? prev + 1 : 0));
  }, [localPdfs.length]);

  // Touch handlers per swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Upload PDFs - chiude subito il modale, upload in background
  const handleUpload = async (files) => {
    if (!projectId || files.length === 0) return;

    // Chiudi subito il modale
    setIsUploadModalOpen(false);
    setUploadResetKey((k) => k + 1);

    // Inizia upload in background nel box
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const currentPdfsLength = localPdfs.length;
      const uploadedPdfs = await uploadPdfs(
        projectId,
        files,
        (progress) => setUploadProgress(progress),
        () => {} // onPdfUploaded
      );

      if (uploadedPdfs.length > 0 && onPdfsChange) {
        const newPdfs = [...localPdfs, ...uploadedPdfs];
        // Aggiorna stato locale immediatamente
        setLocalPdfs(newPdfs);
        // Notifica il parent per salvare nel database
        onPdfsChange(newPdfs);
        // Vai all'ultimo PDF caricato
        setCurrentIndex(currentPdfsLength + uploadedPdfs.length - 1);
      }
    } catch (error) {
      console.error("Errore upload PDF:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Apri conferma eliminazione PDF
  const handleDeletePdfClick = () => {
    if (localPdfs.length > 0 && localPdfs[currentIndex]) {
      setPdfToDelete(localPdfs[currentIndex]);
      setIsDeletePdfConfirmOpen(true);
    }
  };

  // Elimina PDF confermato
  const handleDeletePdfConfirm = async () => {
    if (!pdfToDelete) return;

    try {
      // Elimina dallo storage
      if (pdfToDelete.storagePath) {
        await deletePdf(pdfToDelete.storagePath);
      }

      // Aggiorna array PDF
      const newPdfs = localPdfs.filter((p) => p.id !== pdfToDelete.id);
      // Aggiorna stato locale immediatamente
      setLocalPdfs(newPdfs);
      // Notifica il parent per salvare nel database
      if (onPdfsChange) {
        onPdfsChange(newPdfs);
      }

      setIsDeletePdfConfirmOpen(false);
      setPdfToDelete(null);
    } catch (error) {
      console.error("Errore eliminazione PDF:", error);
    }
  };

  // Menu items specifici per PdfBox
  const pdfMenuItems =
    localPdfs.length > 0
      ? [
          {
            label: "Aggiungi PDF",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => {
              setUploadResetKey((k) => k + 1);
              setIsUploadModalOpen(true);
            },
          },
          {
            label: "Elimina questo PDF",
            icon: <TrashIcon className="w-5 h-5" />,
            onClick: handleDeletePdfClick,
            danger: true,
          },
        ]
      : [];

  const hasPdfs = localPdfs.length > 0;

  return (
    <>
      <BaseBentoBox
        title={title}
        badgeCount={hasPdfs ? localPdfs.length : null}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={pdfMenuItems}
        minHeight={hasPdfs ? undefined : 150}
      >
        {hasPdfs ? (
          // Carosello PDF
          <div className="relative">
            {/* Container PDF */}
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-lg bg-gray-100"
              style={{ height: `${CAROUSEL_HEIGHT}px` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* PDF corrente */}
              <PdfThumbnail
                key={localPdfs[currentIndex]?.id}
                pdf={localPdfs[currentIndex]}
                containerWidth={containerWidth}
              />

              {/* Frecce navigazione (solo se più di 1 PDF) */}
              {localPdfs.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Counter in alto a destra */}
              {localPdfs.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                  {currentIndex + 1} / {localPdfs.length}
                </div>
              )}
            </div>

            {/* Indicatori (pallini) sotto il PDF */}
            {localPdfs.length > 1 && localPdfs.length <= 10 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {localPdfs.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-primary w-4"
                        : "bg-text-muted/30 hover:bg-text-muted/50"
                    }`}
                    aria-label={`Vai al PDF ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Barra di progresso upload (quando upload in corso) */}
            {isUploading && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Caricamento...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : // Stato vuoto - tasto per aggiungere PDF oppure upload in corso
        isUploading ? (
          <div className="w-full py-6 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>Caricamento...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setUploadResetKey((k) => k + 1);
              setIsUploadModalOpen(true);
            }}
            className="
                w-full py-6
                flex flex-col items-center justify-center gap-3
                text-text-muted
                hover:text-primary
                transition-colors duration-200
                group
              "
          >
            <div className="w-14 h-14 rounded-full bg-bg-tertiary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <FileTextIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Aggiungi PDF</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per caricare
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale upload - si chiude subito dopo l'invio */}
      <PdfUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        resetKey={uploadResetKey}
      />

      {/* Conferma eliminazione PDF */}
      <ConfirmModal
        isOpen={isDeletePdfConfirmOpen}
        title="Elimina PDF"
        message="Sei sicuro di voler eliminare questo PDF? L'azione non può essere annullata."
        confirmText="Elimina"
        danger
        onConfirm={handleDeletePdfConfirm}
        onCancel={() => {
          setIsDeletePdfConfirmOpen(false);
          setPdfToDelete(null);
        }}
      />
    </>
  );
};

export default PdfBox;
