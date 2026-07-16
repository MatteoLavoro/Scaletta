import { useEffect, useRef, useCallback } from "react";
import { useModal } from "../../contexts/ModalContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { ArrowLeftIcon, CloseIcon } from "../icons";
import Button from "../ui/Button";

// ─── Helpers: navigazione nell'albero layout ──────────────────────────────────

/**
 * Trova il pannello in posizione topmost-rightmost (desktop → riceve la X).
 * Logica: nei nodi `row` prende l'ultimo figlio (rightmost);
 *         nei nodi `column` prende il primo figlio (topmost).
 */
const getTopRightPanel = (node) => {
  if (!node) return null;
  if (node.type === "panel") return node;
  if (!node.children || node.children.length === 0) return null;
  if (node.type === "row")
    return getTopRightPanel(node.children[node.children.length - 1]);
  return getTopRightPanel(node.children[0]); // column
};

/**
 * Trova il pannello in posizione topmost-leftmost (mobile → riceve la freccia ←).
 * Logica: prende sempre il primo figlio ricorsivamente (sia per row che column).
 */
const getTopLeftPanel = (node) => {
  if (!node) return null;
  if (node.type === "panel") return node;
  if (!node.children || node.children.length === 0) return null;
  return getTopLeftPanel(node.children[0]);
};

// ─── PanelCard ────────────────────────────────────────────────────────────────

/**
 * Singolo pannello card.
 *
 * Struttura:
 *   [Header opzionale: titolo + bottone chiusura solo nel pannello principale]
 *   [Divisore — solo se ha header]
 *   [Contenuto scrollabile]
 *   [Divisore + Footer opzionale: bottone conferma]
 *
 * Regola close button:
 *   - isMainPanel + isMobile  → freccia ← top-left
 *   - isMainPanel + !isMobile → X top-right
 *   Il pannello principale mostra SEMPRE header+divisore (richiesto da spec).
 *   Gli altri pannelli mostrano header+divisore solo se hanno un title.
 *
 * @param {object}   node          - Nodo panel dell'albero layout
 * @param {boolean}  isMainPanel   - Se questo pannello riceve il bottone di chiusura
 * @param {boolean}  isMobile      - Breakpoint mobile
 * @param {function} onClose       - Callback chiusura globale dell'intero SplitModal
 */
const PanelCard = ({ node, isMainPanel, isMobile, onClose }) => {
  const showHeader = isMainPanel || !!node.title;
  const showFooter = !!(node.confirmText && node.onConfirm);

  return (
    <div
      className="flex flex-col bg-bg-secondary rounded-2xl shadow-2xl overflow-hidden"
      style={{
        flex: node.flex ?? 1,
        minWidth: node.minWidth ?? (isMobile ? undefined : "220px"),
        maxWidth: node.maxWidth,
        minHeight: node.minHeight,
        maxHeight: node.maxHeight,
      }}
    >
      {/* ── Header ── */}
      {showHeader && (
        <>
          <header
            className="flex items-center justify-between px-4 min-h-14 shrink-0"
            style={
              isMobile && isMainPanel
                ? {
                    paddingTop: "calc(0.75rem + var(--safe-area-inset-top))",
                    paddingBottom: "0.75rem",
                  }
                : { paddingTop: "0.75rem", paddingBottom: "0.75rem" }
            }
          >
            {/* Sinistra: freccia solo su mobile nel pannello principale */}
            {isMobile && isMainPanel ? (
              <div className="w-10 h-10 -ml-1 rounded-full bg-bg-tertiary flex items-center justify-center">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-full h-full rounded-full text-text-primary hover:bg-divider active:bg-border transition-colors duration-150"
                  aria-label="Chiudi"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="w-10" aria-hidden="true" />
            )}

            {/* Centro: titolo */}
            {node.title ? (
              <h2 className="text-lg font-semibold text-text-primary text-center flex-1 truncate px-2">
                {node.title}
              </h2>
            ) : (
              <div className="flex-1" />
            )}

            {/* Destra: X solo su desktop nel pannello principale */}
            {!isMobile && isMainPanel ? (
              <div className="w-10 h-10 -mr-1 rounded-full bg-bg-tertiary flex items-center justify-center">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-full h-full rounded-full text-text-primary hover:bg-divider active:bg-border transition-colors duration-150"
                  aria-label="Chiudi"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="w-10" aria-hidden="true" />
            )}
          </header>

          {/* Divisore sotto header */}
          <div className="px-6 shrink-0" aria-hidden="true">
            <div className="h-px bg-divider" />
          </div>
        </>
      )}

      {/* ── Contenuto scrollabile ── */}
      <div
        ref={node.contentRef}
        className="flex-1 overflow-y-auto p-6 overscroll-contain"
        style={{ minHeight: 0 }}
      >
        {node.content}
      </div>

      {/* ── Footer con bottone conferma ── */}
      {showFooter && (
        <>
          <div className="px-6 shrink-0" aria-hidden="true">
            <div className="h-px bg-divider" />
          </div>
          <footer className="p-4 shrink-0">
            <Button
              onClick={node.onConfirm}
              disabled={node.confirmDisabled}
              loading={node.isLoading}
              variant={node.confirmVariant || "primary"}
              className="w-full"
              size="lg"
            >
              {node.confirmText}
            </Button>
          </footer>
        </>
      )}
    </div>
  );
};

// ─── LayoutRenderer ───────────────────────────────────────────────────────────

/**
 * Renderer ricorsivo dell'albero layout.
 *
 * Tipi di nodo supportati:
 *   - "panel"  → renderizza un PanelCard
 *   - "row"    → `flex flex-row items-stretch` su desktop; diventa `flex-col` su mobile
 *   - "column" → `flex flex-col` sempre
 *
 * Ogni nodo (row/column) accetta:
 *   - children  : array di nodi figli
 *   - flex      : valore CSS flex (default 1)
 *   - gap       : gap in px (sovrascrive il gap globale)
 *
 * Ogni nodo panel accetta:
 *   - id             : identificatore opzionale
 *   - title          : titolo (obbligatorio nel pannello che riceve la X / freccia)
 *   - content        : ReactNode — contenuto del pannello
 *   - flex           : valore CSS flex (default 1)
 *   - minWidth       : CSS min-width
 *   - minHeight      : CSS min-height
 *   - maxHeight      : CSS max-height
 *   - confirmText    : testo bottone conferma
 *   - onConfirm      : callback bottone conferma
 *   - confirmDisabled: disabilita il bottone
 *   - confirmVariant : "primary" | "secondary" | "ghost"
 *   - isLoading      : mostra spinner nel bottone
 */
const LayoutRenderer = ({ node, mainPanel, onClose, isMobile, gap }) => {
  if (node.type === "panel") {
    return (
      <PanelCard
        node={node}
        isMainPanel={node === mainPanel}
        isMobile={isMobile}
        onClose={onClose}
      />
    );
  }

  // Su mobile le righe diventano colonne (stacking verticale)
  const isRow = !isMobile && node.type === "row";
  const effectiveGap = node.gap ?? gap;

  return (
    <div
      className={`flex ${isRow ? "flex-row items-stretch" : "flex-col"}`}
      style={{
        gap: `${effectiveGap}px`,
        flex: node.flex ?? 1,
        minWidth: node.minWidth ?? 0,
        minHeight: 0,
      }}
    >
      {node.children.map((child, idx) => (
        <LayoutRenderer
          key={child.id ?? `node-${idx}`}
          node={child}
          mainPanel={mainPanel}
          onClose={onClose}
          isMobile={isMobile}
          gap={gap}
        />
      ))}
    </div>
  );
};

// ─── SplitModal ───────────────────────────────────────────────────────────────

/**
 * SplitModal — modale multi-pannello.
 *
 * Estende il sistema modale standard supportando più pannelli indipendenti
 * disposti su un unico overlay tramite un albero di layout dichiarativo.
 *
 * @param {boolean}  isOpen       - Stato apertura
 * @param {function} onClose      - Callback chiusura globale
 * @param {object}   layout       - Albero layout (vedi LayoutRenderer per la struttura)
 * @param {boolean}  [skipHistory=false] - Se true, chiude senza history.back()
 * @param {number}   [zIndex]     - z-index personalizzato (calcolato automaticamente se omesso)
 * @param {number}   [gap=12]     - Gap in px tra i pannelli (default 12)
 * @param {string}   [maxWidth]   - Larghezza massima del layout su desktop (es. "800px"); se omessa il layout occupa il 100% del wrapper di centratura
 * @param {string}   [maxHeight]  - Altezza massima su desktop (default "85vh"); ogni pannello scorre indipendentemente
 */
const SplitModal = ({
  isOpen,
  onClose,
  layout,
  skipHistory = false,
  zIndex: zIndexProp,
  gap = 12,
  maxWidth,
  maxHeight,
}) => {
  const isMobile = useIsMobile();
  const fixedZIndexRef = useRef(null);
  const hasAddedHistoryRef = useRef(false);
  const positionerRef = useRef(null);
  const { modalDepth, registerNestedClose, hasNestedModals } = useModal();

  // Calcola e fissa lo z-index alla prima apertura (come Modal.jsx)
  if (fixedZIndexRef.current === null && isOpen) {
    fixedZIndexRef.current = zIndexProp ?? 1000 + modalDepth * 10;
  }
  useEffect(() => {
    if (!isOpen) fixedZIndexRef.current = null;
  }, [isOpen]);

  const computedZIndex = fixedZIndexRef.current ?? zIndexProp ?? 1000;

  // Gestione chiusura: back o diretta
  const handleClose = useCallback(() => {
    if (skipHistory) {
      onClose?.();
    } else {
      window.history.back();
    }
  }, [skipHistory, onClose]);

  // Gestione history — identica a Modal.jsx
  useEffect(() => {
    if (isOpen && onClose && !skipHistory) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ nestedModal: true }, "");
        hasAddedHistoryRef.current = true;
      }
      const unregister = registerNestedClose(onClose);
      return unregister;
    }
    if (!isOpen) hasAddedHistoryRef.current = false;
  }, [isOpen, onClose, registerNestedClose, skipHistory]);

  // Scroll lock — identico a Modal.jsx
  useEffect(() => {
    if (isOpen) {
      if (!onClose || skipHistory) {
        if (document.body.style.overflow !== "hidden") {
          const scrollbarWidth =
            window.innerWidth - document.documentElement.clientWidth;
          if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
          }
        }
        document.body.style.overflow = "hidden";
      }
      return () => {
        if (!hasNestedModals()) {
          document.body.style.overflow = "";
          document.body.style.paddingRight = "";
        }
      };
    }
  }, [isOpen, onClose, skipHistory, hasNestedModals]);

  // Focus sul contenitore all'apertura (accessibilità base)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        positionerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !layout) return null;

  // Il pannello principale riceve il close button:
  //   - Desktop: topmost-rightmost (X a destra)
  //   - Mobile: topmost-leftmost (freccia ← a sinistra)
  const mainPanel = isMobile
    ? getTopLeftPanel(layout)
    : getTopRightPanel(layout);

  return (
    <>
      {/* Overlay scuro */}
      <div
        className="fixed inset-0 bg-black/60 animate-fade-in"
        style={{ zIndex: computedZIndex - 1 }}
        aria-hidden="true"
      />

      {/* Positioner scorrevole + focus trap base */}
      <div
        ref={positionerRef}
        tabIndex={-1}
        className="fixed inset-0 overflow-y-auto outline-none"
        style={{ zIndex: computedZIndex }}
        role="dialog"
        aria-modal="true"
      >
        {/*
          Wrapper di centratura:
          - Desktop: flex items-center justify-center con padding perimetrale
          - Mobile: flex-col (panels dall'alto verso il basso, scrollabili)
          min-h-full assicura che il flex center funzioni anche per contenuti corti
          senza clippare contenuti alti (pattern corretto per overflow-y: auto).
        */}
        <div
          className={`flex min-h-full ${
            isMobile ? "flex-col" : "items-center justify-center p-6"
          }`}
        >
          {/* Wrapper animazione + sizing */}
          <div
            className={
              isMobile
                ? "animate-slide-in-bottom w-full flex flex-col"
                : "animate-modal-scale flex flex-col"
            }
            style={
              isMobile
                ? {
                    gap: `${gap}px`,
                    paddingBottom:
                      "calc(var(--safe-area-inset-bottom, 0px) + 12px)",
                  }
                : {
                    // Su desktop il layout occupa tutto lo spazio disponibile nel
                    // wrapper di centratura (p-6 = 24px per lato).
                    // maxWidth limita la larghezza se fornito (utile per layout piccoli).
                    // maxHeight vincola l'altezza: ogni pannello scorre indipendentemente.
                    width: "100%",
                    ...(maxWidth ? { maxWidth } : {}),
                    maxHeight: maxHeight ?? "85vh",
                    overflow: "hidden",
                  }
            }
          >
            <LayoutRenderer
              node={layout}
              mainPanel={mainPanel}
              onClose={handleClose}
              isMobile={isMobile}
              gap={gap}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SplitModal;
