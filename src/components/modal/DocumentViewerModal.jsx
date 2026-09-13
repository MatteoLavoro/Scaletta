import { useEffect, useCallback, useState, useRef } from "react";
import {
  ArrowLeftIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  PrinterIcon,
  TrashIcon,
} from "../icons";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useModal } from "../../contexts/ModalContext";

/**
 * DocumentViewerModal - Modale generico per la visualizzazione fullscreen
 * di documenti (immagini, PDF, o altri tipi di file), in stile "Google
 * Chrome PDF viewer".
 *
 * Non va usato direttamente: è pensato per essere "esteso" (via composition)
 * da modali specializzati come ImageDocumentViewer o PdfDocumentViewer, che
 * gli passano il rendering del contenuto e attivano/disattivano le feature
 * della toolbar tramite props.
 *
 * ── Layout ──
 * - Barra superiore (grigio): pillola nome file a sinistra, toolbar centrale
 *   (contatore pagine, zoom, rotazione, download, stampa, elimina), X a destra
 * - Sidebar opzionale a sinistra (anteprime pagine/documenti, solo desktop)
 * - Contenuto principale che si estende fino al bordo inferiore dello schermo
 * - Frecce di navigazione ai lati per passare al documento successivo/precedente
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {array} documents - Array di documenti { id, url, name, type? }
 * @param {number} initialIndex
 * @param {function} onIndexChange - Notifica quando cambia il documento corrente
 * @param {function} renderContent - (document, index) => JSX. Il child gestisce
 *   internamente eventuali ref/resize observer necessari per il proprio contenuto
 * @param {function} renderSidebar - (currentIndex, onIndexChange) => JSX
 * @param {boolean} showSidebar
 * @param {string} sidebarWidth
 * @param {boolean} showZoom
 * @param {number} currentZoom - Percentuale zoom da mostrare (es. 100)
 * @param {function} onZoomIn
 * @param {function} onZoomOut
 * @param {function} onZoomReset
 * @param {boolean} zoomDisabled
 * @param {boolean} showRotate
 * @param {function} onRotate
 * @param {boolean} showDownload
 * @param {function} onDownload - (document, index) => void. Default: fetch+blob
 * @param {boolean} showPrint
 * @param {function} onPrint - (document, index) => void
 * @param {boolean} showDelete
 * @param {function} onDelete - (document, index) => void
 * @param {object} pageCounter - { current, total } pagine interne al documento
 * @param {string} backgroundClassName - classe di sfondo del visualizzatore
 */

/**
 * Download generico: fetch + blob, con fallback su apertura in nuova scheda.
 */
const defaultDownload = async (document) => {
  if (!document?.url) return;
  try {
    const response = await fetch(document.url);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document.name || "documento";
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch {
    window.open(document.url, "_blank");
  }
};

const DocumentViewerModalContent = ({
  documents,
  initialIndex,
  isMobile,
  handleClose,
  onIndexChange,
  renderContent,
  renderSidebar,
  showSidebar = false,
  sidebarWidth = "240px",
  showZoom = false,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomDisabled = false,
  showRotate = false,
  onRotate,
  showDownload = true,
  onDownload,
  showPrint = false,
  onPrint,
  showDelete = false,
  onDelete,
  pageCounter,
  backgroundClassName = "bg-black",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const document = documents[currentIndex];
  const hasMultiple = documents.length > 1;

  const notifyIndexChange = useCallback(
    (index) => {
      setCurrentIndex(index);
      onIndexChange?.(index);
    },
    [onIndexChange],
  );

  const goToPrevious = useCallback(() => {
    notifyIndexChange(
      currentIndex > 0 ? currentIndex - 1 : documents.length - 1,
    );
  }, [currentIndex, documents.length, notifyIndexChange]);

  const goToNext = useCallback(() => {
    notifyIndexChange(
      currentIndex < documents.length - 1 ? currentIndex + 1 : 0,
    );
  }, [currentIndex, documents.length, notifyIndexChange]);

  const handleDownload = useCallback(
    (e) => {
      e.stopPropagation();
      if (onDownload) {
        onDownload(document, currentIndex);
      } else {
        defaultDownload(document);
      }
    },
    [onDownload, document, currentIndex],
  );

  const handlePrint = useCallback(
    (e) => {
      e.stopPropagation();
      if (onPrint) {
        onPrint(document, currentIndex);
      } else if (document?.url) {
        const printWindow = window.open(document.url, "_blank");
        printWindow?.addEventListener("load", () => printWindow.print());
      }
    },
    [onPrint, document, currentIndex],
  );

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      if (document && onDelete) {
        onDelete(document, currentIndex);
      }
    },
    [document, currentIndex, onDelete],
  );

  // Gestione tastiera
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          if (hasMultiple) goToPrevious();
          break;
        case "ArrowRight":
          if (hasMultiple) goToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, goToPrevious, goToNext, hasMultiple]);

  const showToolbarPill =
    (pageCounter && pageCounter.total > 1) ||
    showZoom ||
    showRotate ||
    showDownload ||
    showPrint ||
    showDelete;

  return (
    <div
      className={`fixed inset-0 z-2000 ${backgroundClassName} flex flex-col`}
      style={{
        paddingTop: isMobile ? "var(--safe-area-inset-top)" : 0,
        paddingBottom: isMobile ? "var(--safe-area-inset-bottom)" : 0,
      }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 bg-white/5 border-b border-white/10">
        <div className="h-16 flex items-center justify-between px-4">
          {/* Sinistra: Back button (mobile) / Pillola nome file (desktop) */}
          {isMobile ? (
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Torna indietro"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
          ) : document?.name ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full max-w-[220px] backdrop-blur-sm shrink-0">
              <p className="text-xs text-white/80 truncate select-none font-medium">
                {document.name}
              </p>
            </div>
          ) : (
            <div className="w-10" />
          )}

          {/* Centro: Toolbar in pillola */}
          {showToolbarPill && (
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
              {pageCounter && pageCounter.total > 1 && (
                <>
                  <span className="px-2 text-sm text-white font-medium tabular-nums select-none">
                    {pageCounter.current}/{pageCounter.total}
                  </span>
                  <div className="w-px h-5 bg-white/20" />
                </>
              )}

              {showZoom && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomOut?.();
                    }}
                    disabled={zoomDisabled}
                    className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    aria-label="Riduci zoom"
                  >
                    <ZoomOutIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomReset?.();
                    }}
                    disabled={zoomDisabled}
                    className="px-2 h-8 text-xs text-white/80 hover:bg-white/10 rounded-full transition-colors tabular-nums min-w-[3rem] text-center disabled:opacity-30"
                  >
                    {typeof currentZoom === "number"
                      ? `${Math.round(currentZoom)}%`
                      : "—"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onZoomIn?.();
                    }}
                    disabled={zoomDisabled}
                    className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-30"
                    aria-label="Aumenta zoom"
                  >
                    <ZoomInIcon className="w-5 h-5 text-white" />
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                </>
              )}

              {showRotate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRotate?.();
                  }}
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Ruota documento"
                >
                  <RotateCwIcon className="w-5 h-5 text-white" />
                </button>
              )}

              {showDownload && (
                <button
                  onClick={handleDownload}
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Scarica"
                >
                  <DownloadIcon className="w-5 h-5 text-white" />
                </button>
              )}

              {showPrint && (
                <button
                  onClick={handlePrint}
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Stampa"
                >
                  <PrinterIcon className="w-5 h-5 text-white" />
                </button>
              )}

              {showDelete && onDelete && (
                <>
                  <div className="w-px h-5 bg-white/20" />
                  <button
                    onClick={handleDelete}
                    className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors"
                    aria-label="Elimina"
                  >
                    <TrashIcon className="w-5 h-5 text-red-400" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Destra: Close button (desktop) / Spacer (mobile) */}
          {!isMobile ? (
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Chiudi"
            >
              <CloseIcon className="w-6 h-6 text-white" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* ── Corpo: sidebar + contenuto ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar anteprime (solo desktop) */}
        {showSidebar && renderSidebar && (
          <aside
            className="hidden lg:flex flex-col shrink-0 bg-black/40 border-r border-white/10 overflow-y-auto"
            style={{ width: sidebarWidth, maxWidth: sidebarWidth }}
          >
            {renderSidebar(currentIndex, notifyIndexChange)}
          </aside>
        )}

        {/* Contenuto + frecce navigazione */}
        <div className="flex-1 relative flex overflow-hidden">
          {hasMultiple && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg"
              aria-label="Documento precedente"
            >
              <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          )}

          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              marginLeft: hasMultiple ? "3.5rem" : 0,
              marginRight: hasMultiple ? "3.5rem" : 0,
            }}
          >
            {renderContent?.(document, currentIndex)}
          </div>

          {hasMultiple && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg"
              aria-label="Documento successivo"
            >
              <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * DocumentViewerModal - Wrapper che gestisce apertura/chiusura, history e
 * blocco scroll body. Il contenuto vero e proprio è in
 * DocumentViewerModalContent.
 */
const DocumentViewerModal = ({
  isOpen,
  onClose,
  documents = [],
  initialIndex = 0,
  onIndexChange,
  renderContent,
  renderSidebar,
  showSidebar = false,
  sidebarWidth = "240px",
  showZoom = false,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomDisabled = false,
  showRotate = false,
  onRotate,
  showDownload = true,
  onDownload,
  showPrint = false,
  onPrint,
  showDelete = false,
  onDelete,
  pageCounter,
  backgroundClassName = "bg-black",
}) => {
  const isMobile = useIsMobile();
  const hasAddedHistoryRef = useRef(false);
  const { registerNestedClose } = useModal();

  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    if (isOpen && onClose) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ documentViewerModal: true }, "");
        hasAddedHistoryRef.current = true;
      }
      const unregister = registerNestedClose(onClose);
      return unregister;
    }
    if (!isOpen) hasAddedHistoryRef.current = false;
  }, [isOpen, onClose, registerNestedClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || documents.length === 0) return null;

  return (
    <DocumentViewerModalContent
      key={`${documents[initialIndex]?.id ?? initialIndex}-${isOpen}`}
      documents={documents}
      initialIndex={Math.min(initialIndex, documents.length - 1)}
      isMobile={isMobile}
      handleClose={handleClose}
      onIndexChange={onIndexChange}
      renderContent={renderContent}
      renderSidebar={renderSidebar}
      showSidebar={showSidebar}
      sidebarWidth={sidebarWidth}
      showZoom={showZoom}
      currentZoom={currentZoom}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onZoomReset={onZoomReset}
      zoomDisabled={zoomDisabled}
      showRotate={showRotate}
      onRotate={onRotate}
      showDownload={showDownload}
      onDownload={onDownload}
      showPrint={showPrint}
      onPrint={onPrint}
      showDelete={showDelete}
      onDelete={onDelete}
      pageCounter={pageCounter}
      backgroundClassName={backgroundClassName}
    />
  );
};

export default DocumentViewerModal;
