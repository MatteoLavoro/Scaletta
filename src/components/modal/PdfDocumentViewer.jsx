import { useEffect, useCallback, useState, useRef, Component } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileTextIcon } from "../icons";
import DocumentViewerModal from "./DocumentViewerModal";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const H_PADDING = 24;
const PAGE_GAP = 24;
const THUMB_WIDTH = 140;

// ─── ErrorBoundary ─────────────────────────────────────────────────────────

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

/**
 * PdfDocumentViewer - Visualizzatore fullscreen di PDF (stile Google Chrome).
 *
 * Estende DocumentViewerModal (composition) attivando "zoom", "sidebar"
 * (anteprime pagine) e "page counter" (numero di pagina interno al
 * documento), disattivando "rotazione" (non pertinente per i PDF).
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {array} pdfs - Array di PDF { id, url, name, storagePath }
 * @param {number} initialIndex
 * @param {function} onDelete - Callback per eliminare un PDF (opzionale)
 * @param {function} onIndexChange
 */

/**
 * Renderizza tutte le pagine di un singolo PDF con scroll verticale.
 * Notifica il parent (via callback) zoom e pagina corrente, in modo che la
 * toolbar generica di DocumentViewerModal possa mostrarli.
 */
const SinglePdfContent = ({
  pdf,
  registerZoomControls,
  onPageInfoChange,
}) => {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [baseScale, setBaseScale] = useState(null);
  const [userZoomMultiplier, setUserZoomMultiplier] = useState(1);
  const [isDocLoaded, setIsDocLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [firstPageSize, setFirstPageSize] = useState(null);

  const scrollContainerRef = useRef(null);
  const containerRef = useRef(null);
  const pageRefs = useRef({});
  const containerSizeRef = useRef({ width: 0, height: 0 });

  const computeBaseScale = useCallback((cw, ch, pw, ph) => {
    const scaleByWidth = (cw - H_PADDING * 2) / pw;
    const scaleByHeight = (ch - PAGE_GAP) / (ph * 1.05);
    return Math.max(0.1, Math.min(scaleByWidth, scaleByHeight));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
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
  }, [computeBaseScale, firstPageSize]);

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

  const handleZoomIn = useCallback(() => {
    setUserZoomMultiplier((p) => Math.min(p * 1.25, 5));
  }, []);
  const handleZoomOut = useCallback(() => {
    setUserZoomMultiplier((p) => Math.max(p / 1.25, 0.2));
  }, []);
  const handleZoomReset = useCallback(() => {
    setUserZoomMultiplier(1);
  }, []);

  const scrollToPage = useCallback((pageNumber) => {
    const ref = pageRefs.current[pageNumber];
    ref?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Espone zoom + navigazione pagina al parent (DocumentViewerModal li usa
  // per popolare la toolbar generica e la sidebar thumbnails)
  useEffect(() => {
    registerZoomControls?.({
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      zoomReset: handleZoomReset,
      zoomPercent: Math.round(userZoomMultiplier * 100),
      disabled: !isReady,
      scrollToPage,
    });
  }, [
    registerZoomControls,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    userZoomMultiplier,
    isReady,
    scrollToPage,
  ]);

  // Notifica il parent della pagina corrente (per il counter in toolbar)
  useEffect(() => {
    onPageInfoChange?.({ current: currentPage, total: numPages || 0 });
  }, [currentPage, numPages, onPageInfoChange]);

  const fallback = (
    <div className="flex flex-col items-center justify-center gap-3 h-40 text-white/40">
      <FileTextIcon className="w-10 h-10" />
      <p className="text-sm">Impossibile renderizzare il PDF</p>
    </div>
  );

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      {!isReady && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Caricamento…</p>
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
  );
};

/**
 * PdfPageThumbnail - Singola anteprima pagina nella sidebar
 */
const PdfPageThumbnail = ({ pageNumber, isActive, onClick }) => {
  const thumbWidth = THUMB_WIDTH;
  return (
    <button
      onClick={onClick}
      className={`w-full flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        isActive ? "bg-white/15" : "hover:bg-white/5"
      }`}
    >
      <div
        className={`bg-white shadow-md overflow-hidden ${
          isActive ? "ring-2 ring-primary" : ""
        }`}
        style={{ lineHeight: 0 }}
      >
        <Page
          pageNumber={pageNumber}
          width={thumbWidth}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div
              style={{ width: thumbWidth, height: thumbWidth * 1.3 }}
              className="bg-white/10 animate-pulse"
            />
          }
        />
      </div>
      <span className="text-xs text-white/60 select-none">{pageNumber}</span>
    </button>
  );
};

/**
 * PdfThumbnailsSidebar - Sidebar con le anteprime di tutte le pagine del
 * PDF attualmente aperto (passata a DocumentViewerModal via renderSidebar)
 */
const PdfThumbnailsSidebar = ({ pdf, currentPage, onPageClick }) => {
  const [numPages, setNumPages] = useState(null);

  const onLoadSuccess = useCallback(({ numPages: total }) => {
    setNumPages(total);
  }, []);

  if (!pdf?.url) return null;

  return (
    <div className="p-3 space-y-2">
      <PdfRenderBoundary fallback={null}>
        <Document
          key={pdf.id || pdf.url}
          file={pdf.url}
          onLoadSuccess={onLoadSuccess}
          loading={null}
          error={null}
        >
          {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map(
            (pageNumber) => (
              <PdfPageThumbnail
                key={pageNumber}
                pageNumber={pageNumber}
                isActive={pageNumber === currentPage}
                onClick={() => onPageClick(pageNumber)}
              />
            ),
          )}
        </Document>
      </PdfRenderBoundary>
    </div>
  );
};

const PdfDocumentViewer = ({
  isOpen,
  onClose,
  pdfs = [],
  initialIndex = 0,
  onDelete,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // Controlli zoom + scrollToPage esposti da SinglePdfContent per il PDF corrente
  const [zoomControls, setZoomControls] = useState(null);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 0 });

  const handleIndexChange = useCallback(
    (index) => {
      setCurrentIndex(index);
      setZoomControls(null);
      setPageInfo({ current: 1, total: 0 });
      onIndexChange?.(index);
    },
    [onIndexChange],
  );

  const handleDownload = useCallback(async (pdf) => {
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
  }, []);

  const renderContent = useCallback(
    (pdf) => (
      <SinglePdfContent
        key={pdf.id || pdf.url}
        pdf={pdf}
        registerZoomControls={setZoomControls}
        onPageInfoChange={setPageInfo}
      />
    ),
    [],
  );

  const currentPageNumber = pageInfo.current;
  const renderSidebar = useCallback(
    () => (
      <PdfThumbnailsSidebar
        pdf={pdfs[currentIndex]}
        currentPage={currentPageNumber}
        onPageClick={(pageNumber) => zoomControls?.scrollToPage(pageNumber)}
      />
    ),
    [pdfs, currentIndex, currentPageNumber, zoomControls],
  );

  if (!isOpen || pdfs.length === 0) return null;

  return (
    <DocumentViewerModal
      isOpen={isOpen}
      onClose={onClose}
      documents={pdfs}
      initialIndex={initialIndex}
      onIndexChange={handleIndexChange}
      renderContent={renderContent}
      showSidebar
      sidebarWidth="180px"
      renderSidebar={renderSidebar}
      showZoom
      currentZoom={zoomControls?.zoomPercent}
      onZoomIn={zoomControls?.zoomIn}
      onZoomOut={zoomControls?.zoomOut}
      onZoomReset={zoomControls?.zoomReset}
      zoomDisabled={!zoomControls || zoomControls.disabled}
      showRotate={false}
      showDownload
      onDownload={handleDownload}
      showDelete={!!onDelete}
      onDelete={onDelete}
      pageCounter={pageInfo}
      backgroundClassName="bg-[#1e1e1e]"
    />
  );
};

export default PdfDocumentViewer;
