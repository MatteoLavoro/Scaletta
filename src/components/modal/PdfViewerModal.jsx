import { useEffect, useCallback, useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ArrowLeftIcon,
  CloseIcon,
  DownloadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ExternalLinkIcon,
} from "../icons";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useModal } from "../../contexts/ModalContext";

// Configura il worker per react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Padding orizzontale attorno alle pagine
const H_PADDING = 24;
// Gap tra le pagine
const PAGE_GAP = 12;

/**
 * PdfViewerModalContent - Visualizzatore PDF a scroll verticale.
 * Tutte le pagine sono renderizzate in sequenza.
 * Lo zoom iniziale è calcolato in modo da mostrare tutta la prima pagina + 5% della seconda.
 */
const PdfViewerModalContent = ({ pdf, isMobile, handleClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // baseScale: calcolato automaticamente in base al viewport e alle dimensioni della prima pagina
  const [baseScale, setBaseScale] = useState(null);
  // userZoomMultiplier: moltiplicatore applicato dall'utente (1 = zoom automatico)
  const [userZoomMultiplier, setUserZoomMultiplier] = useState(1);
  const [isDocLoaded, setIsDocLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const pageRefs = useRef({});
  // Dimensioni fisiche della prima pagina in punti PDF (scala 1)
  const [firstPageSize, setFirstPageSize] = useState(null);
  // Dimensioni correnti del container (non triggera re-render, solo per calcoli interni)
  const containerSizeRef = useRef({ width: 0, height: 0 });

  // Calcola la scala ottimale per "fit prima pagina + 5% seconda"
  const computeBaseScale = useCallback((cw, ch, pw, ph) => {
    // Scale per larghezza: la pagina occupa tutta la larghezza meno il padding
    const scaleByWidth = (cw - H_PADDING * 2) / pw;
    // Scale per altezza: la prima pagina deve stare nel 95% dell'altezza disponibile
    // (il restante 5% mostra l'inizio della seconda pagina)
    // Approssimiamo: ch ≈ ph*scale + gap + ph*scale*0.05
    // => scale ≈ ch / (ph * 1.05 + gap)
    const scaleByHeight = (ch - PAGE_GAP) / (ph * 1.05);
    // Usa il minore per garantire che la pagina entri sia in larghezza che in altezza
    return Math.max(0.1, Math.min(scaleByWidth, scaleByHeight));
  }, []);

  // ResizeObserver sul container: ricalcola baseScale al resize
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (
        width === containerSizeRef.current.width &&
        height === containerSizeRef.current.height
      )
        return;
      containerSizeRef.current = { width, height };
      if (firstPageSize) {
        const { width: pw, height: ph } = firstPageSize;
        setBaseScale(computeBaseScale(width, height, pw, ph));
      }
    };

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    measure();
    return () => observer.disconnect();
  }, [computeBaseScale, firstPageSize]);

  // Caricamento documento: ottieni dimensioni prima pagina e calcola baseScale
  const onDocumentLoadSuccess = useCallback(
    async (pdfDoc) => {
      setNumPages(pdfDoc.numPages);
      try {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setFirstPageSize({ width: viewport.width, height: viewport.height });
        const { width: cw, height: ch } = containerSizeRef.current;
        if (cw && ch) {
          setBaseScale(
            computeBaseScale(cw, ch, viewport.width, viewport.height),
          );
        }
      } catch {
        // Fallback se getPage fallisce
        setBaseScale(1);
      }
      setIsDocLoaded(true);
    },
    [computeBaseScale],
  );

  const onDocumentLoadError = useCallback(() => {
    setHasError(true);
    setIsDocLoaded(true);
  }, []);

  // Aggiorna indicatore pagina corrente tramite scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const midY = containerRect.top + containerRect.height * 0.4;
      let closest = 1;
      let closestDist = Infinity;
      for (let i = 1; i <= (numPages || 0); i++) {
        const ref = pageRefs.current[i];
        if (!ref) continue;
        const rect = ref.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - midY);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      setCurrentPage(closest);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [numPages]);

  // Tastiera: Escape per chiudere
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  // Zoom
  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier((prev) => Math.min(prev * 1.25, 5));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier((prev) => Math.max(prev / 1.25, 0.2));
  }, []);

  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier(1);
  }, []);

  // Apri in nuova scheda
  const handleOpenInNewTab = useCallback(
    (e) => {
      e.stopPropagation();
      if (pdf?.url) window.open(pdf.url, "_blank");
    },
    [pdf],
  );

  // Download
  const handleDownload = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!pdf?.url) return;
      try {
        const response = await fetch(pdf.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = pdf.name || "documento.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(pdf.url, "_blank");
      }
    },
    [pdf],
  );

  const effectiveScale =
    baseScale !== null ? baseScale * userZoomMultiplier : null;
  const pageWidth =
    effectiveScale && firstPageSize
      ? Math.round(firstPageSize.width * effectiveScale)
      : undefined;

  const isReady = isDocLoaded && baseScale !== null && pageWidth !== undefined;

  return (
    <div
      className="fixed inset-0 bg-[#2b2b2b] flex flex-col"
      style={{ zIndex: 2000 }}
    >
      {/* Header */}
      <div className="shrink-0 h-14 flex items-center justify-between px-3 bg-black/70 backdrop-blur-sm">
        {/* Chiudi / Indietro */}
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label={isMobile ? "Torna indietro" : "Chiudi"}
        >
          {isMobile ? (
            <ArrowLeftIcon className="w-5 h-5 text-white" />
          ) : (
            <CloseIcon className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Centro: indicatore pagina (solo testo, non interattivo) */}
        <div className="flex items-center">
          {numPages && (
            <span className="text-sm text-white/70 font-medium tabular-nums select-none">
              {currentPage} / {numPages}
            </span>
          )}
        </div>

        {/* Destra: toolbar zoom + azioni */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleZoomOut}
            disabled={!isReady || userZoomMultiplier <= 0.2}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Riduci zoom"
          >
            <ZoomOutIcon className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={handleZoomReset}
            disabled={!isReady}
            className="px-2 h-7 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors tabular-nums min-w-[3.2rem] text-center"
            aria-label="Reset zoom"
          >
            {Math.round(userZoomMultiplier * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={!isReady || userZoomMultiplier >= 5}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Aumenta zoom"
          >
            <ZoomInIcon className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button
            onClick={handleOpenInNewTab}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Apri in nuova scheda"
          >
            <ExternalLinkIcon className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Scarica PDF"
          >
            <DownloadIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Area contenuto */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        {/* Spinner caricamento */}
        {!isReady && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Caricamento PDF…</p>
            </div>
          </div>
        )}

        {/* Errore */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <p className="text-white/80 font-medium">
              Impossibile caricare il PDF
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
            >
              Scarica il PDF
            </button>
          </div>
        )}

        {/* Scroll container: tutte le pagine in colonna */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overflow-x-auto"
          style={{
            visibility: isReady ? "visible" : "hidden",
          }}
        >
          {/* Wrapper centrato con padding */}
          <div
            className="flex flex-col items-center py-4"
            style={{
              gap: PAGE_GAP,
              paddingLeft: H_PADDING,
              paddingRight: H_PADDING,
            }}
          >
            <Document
              file={pdf.url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
            >
              {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <div
                    key={pageNumber}
                    ref={(el) => {
                      pageRefs.current[pageNumber] = el;
                    }}
                    className="bg-white shadow-2xl"
                    style={{ lineHeight: 0, flexShrink: 0 }}
                  >
                    {pageWidth && (
                      <Page
                        pageNumber={pageNumber}
                        width={pageWidth}
                        renderTextLayer
                        renderAnnotationLayer
                      />
                    )}
                  </div>
                ),
              )}
            </Document>
          </div>
        </div>
      </div>

      {/* Footer: nome file */}
      {pdf?.name && (
        <div className="shrink-0 py-1.5 px-4 flex justify-center bg-black/50">
          <p className="text-xs text-white/40 truncate max-w-sm select-none">
            {pdf.name}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * PdfViewerModal - Modale per visualizzare PDF a schermo intero
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback per chiudere il modale
 * @param {object} pdf - Oggetto PDF { id, url, name }
 */
const PdfViewerModal = ({ isOpen, onClose, pdf = null }) => {
  const isMobile = useIsMobile();
  const hasAddedHistoryRef = useRef(false);
  const { registerNestedClose } = useModal();

  // Chiude il modale via history.back()
  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  // Gestione history per back button
  useEffect(() => {
    if (isOpen && onClose) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ pdfViewerModal: true }, "");
        hasAddedHistoryRef.current = true;
      }

      const unregister = registerNestedClose(onClose);
      return unregister;
    }

    if (!isOpen) {
      hasAddedHistoryRef.current = false;
    }
  }, [isOpen, onClose, registerNestedClose]);

  // Blocca scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !pdf) return null;

  return (
    <PdfViewerModalContent
      key={`${pdf.id}-${isOpen}`}
      pdf={pdf}
      isMobile={isMobile}
      handleClose={handleClose}
    />
  );
};

export default PdfViewerModal;
