import { useEffect, useCallback, useState, useRef, Component } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ArrowLeftIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ExternalLinkIcon,
  FileTextIcon,
} from "../icons";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useModal } from "../../contexts/ModalContext";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const H_PADDING = 24;
const PAGE_GAP = 12;

// â”€â”€â”€ ErrorBoundary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class PdfRenderBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// â”€â”€â”€ SinglePdfContent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Renderizza tutte le pagine di un singolo PDF con scroll verticale.
 * Riceve il ref del container padre per calcolare la scala ottimale.
 */
const SinglePdfContent = ({ pdf, containerRef }) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [baseScale, setBaseScale] = useState(null);
  const [userZoomMultiplier, setUserZoomMultiplier] = useState(1);
  const [isDocLoaded, setIsDocLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [firstPageSize, setFirstPageSize] = useState(null);

  const scrollContainerRef = useRef(null);
  const pageRefs = useRef({});
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const computeBaseScale = useCallback((cw, ch, pw, ph) => {
    const scaleByWidth = (cw - H_PADDING * 2) / pw;
    const scaleByHeight = (ch - PAGE_GAP) / (ph * 1.05);
    return Math.max(0.1, Math.min(scaleByWidth, scaleByHeight));
  }, []);

  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (
        width === containerSizeRef.current.width &&
        height === containerSizeRef.current.height
      )
        return;
      containerSizeRef.current = { width, height };
      if (firstPageSize) {
        setBaseScale(
          computeBaseScale(
            width,
            height,
            firstPageSize.width,
            firstPageSize.height,
          ),
        );
      }
    });
    observer.observe(el);
    const { width, height } = el.getBoundingClientRect();
    containerSizeRef.current = { width, height };
    return () => observer.disconnect();
  }, [containerRef, computeBaseScale, firstPageSize]);

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

  const effectiveScale =
    baseScale !== null ? baseScale * userZoomMultiplier : null;
  const pageWidth =
    effectiveScale && firstPageSize
      ? Math.round(firstPageSize.width * effectiveScale)
      : undefined;
  const isReady = isDocLoaded && baseScale !== null && pageWidth !== undefined;

  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier((p) => Math.min(p * 1.25, 5));
  }, []);
  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier((p) => Math.max(p / 1.25, 0.2));
  }, []);
  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setUserZoomMultiplier(1);
  }, []);

  const fallback = (
    <div className="flex flex-col items-center justify-center gap-3 h-40 text-white/40">
      <FileTextIcon className="w-10 h-10" />
      <p className="text-sm">Impossibile renderizzare il PDF</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Barra zoom */}
      <div className="shrink-0 flex items-center justify-center py-2">
        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-white/10 rounded-full backdrop-blur-sm">
          <button
            onClick={handleZoomOut}
            disabled={!isReady || userZoomMultiplier <= 0.2}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30"
            aria-label="Riduci zoom"
          >
            <ZoomOutIcon className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleZoomReset}
            disabled={!isReady}
            className="px-2 h-7 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors tabular-nums min-w-[3rem] text-center"
          >
            {Math.round(userZoomMultiplier * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            disabled={!isReady || userZoomMultiplier >= 5}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors disabled:opacity-30"
            aria-label="Aumenta zoom"
          >
            <ZoomInIcon className="w-4 h-4 text-white" />
          </button>
          {numPages && numPages > 1 && (
            <>
              <div className="w-px h-4 bg-white/20 mx-1" />
              <span className="text-xs text-white/40 tabular-nums pr-1 select-none">
                p. {currentPage}/{numPages}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Area scrollabile */}
      <div className="flex-1 relative overflow-hidden">
        {!isReady && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Caricamentoâ€¦</p>
          </div>
        )}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <FileTextIcon className="w-12 h-12 text-white/20" />
            <p className="text-white/50 text-sm font-medium">
              Impossibile caricare il PDF
            </p>
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-y-auto overflow-x-auto"
          style={{ visibility: isReady ? "visible" : "hidden" }}
        >
          <div
            className="flex flex-col items-center py-4"
            style={{
              gap: PAGE_GAP,
              paddingLeft: H_PADDING,
              paddingRight: H_PADDING,
            }}
          >
            <PdfRenderBoundary fallback={fallback}>
              <Document
                key={pdf.id || pdf.url}
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
            </PdfRenderBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

// â”€â”€â”€ PdfViewerModalContent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PdfViewerModalContent = ({
  pdfs,
  initialIndex,
  isMobile,
  handleClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const contentAreaRef = useRef(null);

  const pdf = pdfs[currentIndex];
  const hasMultiple = pdfs.length > 1;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pdfs.length - 1));
  }, [pdfs.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < pdfs.length - 1 ? prev + 1 : 0));
  }, [pdfs.length]);

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

  const handleOpenInNewTab = useCallback(
    (e) => {
      e.stopPropagation();
      if (pdf?.url) window.open(pdf.url, "_blank");
    },
    [pdf],
  );

  useEffect(() => {
    const onKeyDown = (e) => {
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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose, goToPrevious, goToNext, hasMultiple]);

  return (
    <div
      className="fixed inset-0 bg-[#1e1e1e] flex flex-col"
      style={{
        zIndex: 2000,
        paddingTop: isMobile ? "var(--safe-area-inset-top)" : 0,
        paddingBottom: isMobile ? "var(--safe-area-inset-bottom)" : 0,
      }}
    >
      {/* â”€â”€ Header â”€â”€ */}
      <div className="shrink-0 h-14 flex items-center justify-between px-3 bg-black/40 backdrop-blur-sm">
        {/* Chiudi */}
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

        {/* Counter PDF */}
        {hasMultiple ? (
          <div className="flex items-center px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
            <span className="text-sm text-white/80 font-medium tabular-nums select-none">
              {currentIndex + 1} / {pdfs.length}
            </span>
          </div>
        ) : (
          <div />
        )}

        {/* Azioni */}
        <div className="flex items-center gap-0.5 px-1 py-1 bg-white/10 rounded-full backdrop-blur-sm">
          <button
            onClick={handleOpenInNewTab}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Apri in nuova scheda"
          >
            <ExternalLinkIcon className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors"
            aria-label="Scarica PDF"
          >
            <DownloadIcon className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* â”€â”€ Area principale con frecce ai lati â”€â”€ */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Freccia sinistra */}
        {hasMultiple && (
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg"
            aria-label="PDF precedente"
          >
            <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        )}

        {/* Contenuto PDF */}
        <div
          ref={contentAreaRef}
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            marginLeft: hasMultiple ? "3.5rem" : 0,
            marginRight: hasMultiple ? "3.5rem" : 0,
          }}
        >
          <SinglePdfContent
            key={pdf.id || pdf.url}
            pdf={pdf}
            containerRef={contentAreaRef}
          />
        </div>

        {/* Freccia destra */}
        {hasMultiple && (
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg"
            aria-label="PDF successivo"
          >
            <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        )}
      </div>

      {/* â”€â”€ Pill nome file â”€â”€ */}
      <div className="shrink-0 py-3 flex justify-center">
        {pdf?.name && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full max-w-[80%]">
            <FileTextIcon className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <p className="text-sm text-white/75 truncate select-none">
              {pdf.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// â”€â”€â”€ PdfViewerModal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * PdfViewerModal - Visualizzatore PDF fullscreen con navigazione multi-documento
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {array}  pdfs - Array di PDF { id, url, name, storagePath }
 * @param {number} initialIndex - Indice del PDF da aprire
 */
const PdfViewerModal = ({ isOpen, onClose, pdfs = [], initialIndex = 0 }) => {
  const isMobile = useIsMobile();
  const hasAddedHistoryRef = useRef(false);
  const { registerNestedClose } = useModal();

  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    if (isOpen && onClose) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ pdfViewerModal: true }, "");
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

  if (!isOpen || !pdfs.length) return null;

  return (
    <PdfViewerModalContent
      key={`${pdfs[initialIndex]?.id}-${isOpen}`}
      pdfs={pdfs}
      initialIndex={Math.min(initialIndex, pdfs.length - 1)}
      isMobile={isMobile}
      handleClose={handleClose}
    />
  );
};

export default PdfViewerModal;
