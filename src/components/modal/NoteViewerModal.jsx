import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import Modal from "./Modal";
import SplitModal from "./SplitModal";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import renderMarkdown from "../../utils/markdownRenderer";
import { exportNoteToPdf } from "../../services/pdfExport";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useModal } from "../../contexts/ModalContext";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileTextIcon,
  ListChecksIcon,
  MoreVerticalIcon,
  PencilIcon,
  ZoomInIcon,
} from "../icons";

// ─── Estrazione Table of Contents dal markdown renderizzato ────────────────

/**
 * Estrae il table of contents dal markdown renderizzato.
 *
 * Strategia:
 * 1. Estrae TUTTI gli heading h1-h6[id] dal documento
 * 2. Identifica la "sezione indice" come i primi heading che contengono SOLO link
 *    interni (<a href="#...">) — questi vengono esclusi dal TOC finale
 * 3. Ritorna gli heading rimanenti (il contenuto vero del documento)
 *
 * Questo consente di:
 * - Supportare documenti con o senza sezione indice
 * - Usare il testo dagli heading del documento come label nel TOC
 * - Escludere la sezione indice dal tracking della posizione di lettura
 *
 * @param {string} markdown - Sorgente markdown
 * @returns {{ depth: number, text: string, slug: string }[]}
 */
/**
 * Verifica se un elemento heading è composto SOLO da link interni (anchor link).
 * Serve a riconoscere le voci di un indice automatico (es. "## [Intro](#intro)").
 */
function isInternalLinkOnly(el) {
  const nodes = Array.from(el.childNodes);
  if (nodes.length === 0) return false;
  let hasLink = false;
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) return false;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (
        node.tagName === "A" &&
        (node.getAttribute("href") || "").startsWith("#")
      ) {
        hasLink = true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  return hasLink;
}

/** Riconosce i titoli che introducono una sezione indice. */
function isIndexTitle(text) {
  const t = (text || "").trim().toLowerCase();
  return (
    t === "indice" ||
    t === "sommario" ||
    t === "index" ||
    t === "toc" ||
    t === "contents" ||
    t === "table of contents"
  );
}

/**
 * Estrae il table of contents dal markdown renderizzato.
 *
 * Strategia robusta:
 * 1. Estrae TUTTI gli heading h1-h6[id]
 * 2. Salta la sezione indice in cima, riconosciuta come:
 *    - un titolo "Indice"/"Sommario"/… (con o senza link), oppure
 *    - una sequenza iniziale di heading composti SOLO da link interni
 * 3. Deduplica gli slug: una voce di indice e l'heading di contenuto possono
 *    condividere lo stesso id (es. "[Intro](#intro)" → id "intro")
 *
 * @param {string} markdown - Sorgente markdown
 * @returns {{ depth: number, text: string, slug: string }[]}
 */
function extractTableOfContents(markdown) {
  if (!markdown || typeof DOMParser === "undefined") return [];
  try {
    const html = renderMarkdown(markdown);
    const doc = new DOMParser().parseFromString(html, "text/html");

    const allHeadings = Array.from(
      doc.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"),
    ).map((el) => ({
      id: el.id,
      text: el.textContent?.trim() || "",
      depth: parseInt(el.tagName[1]),
      linksOnly: isInternalLinkOnly(el),
    }));

    // Individua l'inizio del contenuto reale saltando la sezione indice.
    let start = 0;
    while (start < allHeadings.length && allHeadings[start].linksOnly) start++;
    if (start < allHeadings.length && isIndexTitle(allHeadings[start].text)) {
      start++;
      while (start < allHeadings.length && allHeadings[start].linksOnly) {
        start++;
      }
    }

    // Deduplica gli slug ed esclude eventuali heading-indice superstiti
    const seen = new Set();
    const result = [];
    for (let i = start; i < allHeadings.length; i++) {
      const h = allHeadings[i];
      if (h.linksOnly || !h.id || seen.has(h.id)) continue;
      seen.add(h.id);
      result.push({ slug: h.id, text: h.text, depth: h.depth });
    }
    return result;
  } catch {
    return [];
  }
}

// ─── Pannello TOC con evidenziazione posizione corrente ───────────────────────

/**
 * Lista cliccabile dei titoli del documento.
 * Evidenzia la voce corrispondente alla sezione attualmente visibile nel
 * pannello centrale e scorre automaticamente per tenerla visibile nel TOC.
 */
const TocContent = ({
  headings,
  onHeadingClick,
  activeSlug,
  favorites,
  onFavoriteToggle,
}) => {
  const activeItemRef = useRef(null);

  // Scorre il TOC per mantenere visibile la voce attiva.
  // Usa "instant" per evitare animazioni in conflitto quando l'utente
  // scorre velocemente e l'heading attivo cambia più volte al secondo.
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: "instant",
      block: "nearest",
    });
  }, [activeSlug]);

  if (!headings.length) {
    return (
      <p className="text-xs text-text-muted italic">
        Nessun titolo trovato nel documento.
      </p>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Indice del documento">
      {headings.map((h, i) => {
        const isActive = h.slug === activeSlug;
        const isFavorite = favorites.has(h.slug);
        return (
          <button
            key={i}
            ref={isActive ? activeItemRef : null}
            onClick={() => onHeadingClick(h.slug)}
            title={h.text}
            className={`
              group text-left text-xs leading-snug rounded-lg py-1.5 px-2 w-full
              transition-colors duration-150 flex items-center justify-between
              ${
                isActive
                  ? "text-primary bg-primary/15 font-semibold"
                  : "text-text-secondary hover:text-primary hover:bg-primary/10"
              }
            `}
            style={{
              paddingLeft: `${(h.depth - 1) * 10 + 8}px`,
              paddingRight: "8px",
            }}
          >
            <span className="truncate flex-1">{h.text}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onFavoriteToggle(h.slug);
              }}
              type="button"
              className={`ml-1 shrink-0 leading-none h-5 w-5 flex items-center justify-center text-lg transition-opacity duration-150 ${
                isFavorite ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              aria-label={
                isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
            >
              {isFavorite ? (
                <span className="text-yellow-400">★</span>
              ) : (
                <span className="text-text-secondary hover:text-primary">
                  ☆
                </span>
              )}
            </button>
          </button>
        );
      })}
    </nav>
  );
};

// ─── NoteViewerModal ──────────────────────────────────────────────────────────

/**
 * NoteViewerModal — visualizzatore nota a lettura.
 *
 * - contentType "txt"      → Modal classico invariato (max-w-[992px])
 * - contentType "markdown" → SplitModal a 3 colonne a tutto schermo:
 *     [Indice TOC 400px] | [Contenuto Markdown — espandibile] | [Strumenti 400px]
 *
 * Caratteristiche markdown:
 *   • Ogni colonna ha la propria scrollbar indipendente.
 *   • Scorrere il contenuto centrale NON muove le colonne laterali.
 *   • La voce TOC corrispondente alla sezione corrente viene evidenziata
 *     e tenuta visibile nella colonna di sinistra.
 *   • I click sulla TOC scrollano il pannello centrale (non il documento intero).
 */
const NoteViewerModal = ({
  isOpen,
  onClose,
  title,
  content,
  contentType = "txt",
  onEdit,
}) => {
  // ── Tutti gli hook prima di qualsiasi return condizionale ────────────────
  const isMobile = useIsMobile();
  const { registerNestedClose, modalDepth } = useModal();

  // Disabilita selezione testo in background
  useEffect(() => {
    if (isOpen) {
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.userSelect = "";
      };
    }
  }, [isOpen]);

  // Estrae il table of contents dal markdown renderizzato (solo per markdown)
  const headings = useMemo(() => {
    if (contentType !== "markdown") return [];
    const allHeadings = extractTableOfContents(content);
    // Filtra per mostrare solo i titoli principali (h1 e h2)
    // Questo riduce il rumore nel TOC e mostra solo le sezioni principali
    return allHeadings.filter((h) => h.depth <= 2);
  }, [content, contentType]);

  // Stato per i paragrafi preferiti (salvati solo durante la sessione)
  const [favorites, setFavorites] = useState(new Set());

  const toggleFavorite = useCallback((slug) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Slug del titolo attivo (evidenziato nel TOC)
  const [activeSlug, setActiveSlug] = useState(null);

  // Ref al div wrapper del MarkdownRenderer (per cercare heading by id)
  const markdownContainerRef = useRef(null);

  // Ref al div scrollabile del pannello centrale (esposto via contentRef di SplitModal)
  const centerScrollRef = useRef(null);

  // Gestione history dedicata al layout mobile
  const hasAddedHistoryRef = useRef(false);

  // Scala di visualizzazione del contenuto markdown (50%–250%, step 25%)
  const [scale, setScale] = useState(100);

  const [isExporting, setIsExporting] = useState(false);

  // Pannelli a comparsa (solo mobile): indice e strumenti
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

  const handleExportPdf = async () => {
    if (isExporting || !content?.trim()) return;
    setIsExporting(true);
    try {
      await exportNoteToPdf(title || "Nota", content);
    } catch (err) {
      if (err?.message) alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMd = () => {
    if (!content?.trim()) return;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "nota"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Risolve uno slug nell'elemento heading di CONTENUTO. Importante: una voce
  // d'indice e l'heading di contenuto possono condividere lo stesso id, ma la
  // voce d'indice sta in cima al documento: prendiamo l'ULTIMO heading valido.
  const resolveHeadingEl = useCallback((slug) => {
    const container = markdownContainerRef.current;
    if (!container) return null;
    const matches = Array.from(
      container.querySelectorAll(`[id="${CSS.escape(slug)}"]`),
    ).filter((el) => /^H[1-6]$/.test(el.tagName) && !isInternalLinkOnly(el));
    return matches[matches.length - 1] || null;
  }, []);

  // Click su voce TOC → scorre SOLO nel pannello centrale (non nel documento)
  const handleHeadingClick = useCallback(
    (slug) => {
      const el = resolveHeadingEl(slug);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [resolveHeadingEl],
  );

  // Traccia la posizione di lettura: evidenzia nel TOC la sezione corrente.
  //
  // Algoritmo (linea di riferimento): la sezione attiva è l'ULTIMO heading il cui
  // top è sopra una linea posta poco sotto il bordo superiore del pannello. È
  // stabile e non risente degli heading dell'indice (esclusi da resolveHeadingEl).
  // scale nei dep: al cambio zoom le posizioni cambiano e va ricalcolato.
  // Alla chiusura del modale si azzera lo slug (evita stato stale).
  useEffect(() => {
    if (!isOpen) {
      setActiveSlug(null);
      return;
    }

    const scrollEl = centerScrollRef.current;
    if (!scrollEl || !headings.length) {
      setActiveSlug(null);
      return;
    }

    // Elementi heading di CONTENUTO, ordinati per posizione REALE nel DOM.
    // L'ordinamento per DOM li rende immuni all'ordine del TOC (che può essere
    // falsato dalle voci d'indice che ripetono gli id dei titoli).
    const headingEls = headings
      .map((h) => resolveHeadingEl(h.slug))
      .filter(Boolean)
      .filter((el, i, arr) => arr.indexOf(el) === i);
    if (!headingEls.length) {
      setActiveSlug(null);
      return;
    }
    headingEls.sort((a, b) => {
      if (a === b) return 0;
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });

    let rafId = null;

    const handleScroll = () => {
      if (rafId !== null) return; // già in coda un frame
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const containerTop = scrollEl.getBoundingClientRect().top;
        // Linea di riferimento poco sotto il bordo superiore del pannello
        const referenceOffset = Math.min(scrollEl.clientHeight * 0.25, 120);

        // Sezione attiva = ULTIMO heading il cui top è sopra la linea di
        // riferimento. Calcolo su TUTTI gli elementi (senza "break"): l'ordine
        // per DOM garantisce che sia quello corretto anche con id duplicati.
        let activeEl = null;
        let bestOffset = -Infinity;
        for (const el of headingEls) {
          const elTop = el.getBoundingClientRect().top - containerTop;
          if (elTop <= referenceOffset && elTop > bestOffset) {
            bestOffset = elTop;
            activeEl = el;
          }
        }
        if (!activeEl) activeEl = headingEls[0];
        setActiveSlug(activeEl?.id ?? null);
      });
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll(); // stato iniziale immediato all'apertura
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isOpen, headings, scale, resolveHeadingEl]);

  // ── Mobile: gestione history dedicata (sul desktop la gestisce SplitModal) ──
  useEffect(() => {
    if (!isOpen || !isMobile || contentType !== "markdown") {
      hasAddedHistoryRef.current = false;
      return;
    }
    if (!hasAddedHistoryRef.current) {
      window.history.pushState({ nestedModal: true }, "");
      hasAddedHistoryRef.current = true;
    }
    const unregister = registerNestedClose(onClose);
    return unregister;
  }, [isOpen, isMobile, contentType, onClose, registerNestedClose]);

  // ── Modalità TXT: modale classico invariato ──────────────────────────────
  if (contentType !== "markdown") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title || "Nota"}
        variant="info"
        maxWidth="max-w-[992px]"
      >
        <div
          className="text-sm text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content || "" }}
          style={{
            userSelect: "text",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        />
      </Modal>
    );
  }

  // ── Modalità Markdown: SplitModal — colonna sx (Indice 75% + Strumenti 25%) + contenuto dx ──
  //
  // Struttura:
  //   ┌─────────────────┬──────────────────────┐
  //   │  Indice  (75%)  │                      │
  //   │                 │  Contenuto Markdown  │
  //   ├─────────────────│  (flex 1, X desktop) │
  //   │ Strumenti (25%) │                      │
  //   └─────────────────┴──────────────────────┘
  //
  // Desktop: X nel pannello contenuto (topmost-rightmost).
  // Mobile:  freccia ← nel pannello Indice (topmost-leftmost).
  const layout = {
    type: "row",
    children: [
      // ── Colonna sinistra: Indice + Strumenti ─────────────────────────
      {
        type: "column",
        flex: "0 1 400px",
        minWidth: "280px",
        children: [
          // Indice: 75% dell'altezza della colonna
          {
            type: "panel",
            id: "toc",
            title: "Indice",
            flex: 3,
            content: (
              <TocContent
                headings={headings}
                onHeadingClick={handleHeadingClick}
                activeSlug={activeSlug}
                favorites={favorites}
                onFavoriteToggle={toggleFavorite}
              />
            ),
          },
          // Strumenti: 25% dell'altezza della colonna
          {
            type: "panel",
            id: "actions",
            title: "Strumenti",
            flex: 1,
            content: (
              <div className="flex flex-col gap-1">
                {/* Zoom */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <ZoomInIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">Zoom</span>
                  </div>
                  <div className="flex items-center bg-bg-tertiary rounded-xl p-0.5">
                    <button
                      onClick={() => setScale((s) => Math.max(50, s - 25))}
                      disabled={scale <= 50}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                      aria-label="Riduci scala"
                    >
                      −
                    </button>
                    <span className="text-xs font-semibold text-text-primary min-w-12 text-center tabular-nums">
                      {scale}%
                    </span>
                    <button
                      onClick={() => setScale((s) => Math.min(250, s + 25))}
                      disabled={scale >= 250}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-base font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                      aria-label="Aumenta scala"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Divisore */}
                <div className="h-px bg-divider my-1" />

                {/* Esporta PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExporting || !content?.trim()}
                  className="flex items-center gap-2 w-full px-2 py-2 rounded-xl hover:bg-bg-tertiary active:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
                >
                  <DownloadIcon
                    className={`w-4 h-4 shrink-0 ${
                      isExporting ? "text-primary animate-pulse" : ""
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isExporting ? "text-primary font-medium" : ""
                    }`}
                  >
                    {isExporting ? "Generazione…" : "Esporta PDF"}
                  </span>
                </button>

                {/* Esporta MD */}
                <button
                  type="button"
                  onClick={handleExportMd}
                  disabled={!content?.trim()}
                  className="flex items-center gap-2 w-full px-2 py-2 rounded-xl hover:bg-bg-tertiary active:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
                >
                  <FileTextIcon className="w-4 h-4 shrink-0" />
                  <span className="text-sm">Esporta MD</span>
                </button>

                {/* Modifica */}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit();
                    }}
                    className="flex items-center gap-2 w-full px-2 py-2 rounded-xl hover:bg-bg-tertiary active:bg-divider transition-colors text-text-primary"
                  >
                    <PencilIcon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">Modifica</span>
                  </button>
                )}
              </div>
            ),
          },
        ],
      },
      // ── Colonna destra: contenuto markdown (occupa tutta l'altezza) ──
      {
        type: "panel",
        id: "content",
        title: title || "Nota",
        flex: 1,
        minWidth: "320px",
        contentRef: centerScrollRef,
        content: (
          // Il div esterno NON applica zoom: serve solo come ancora per
          // markdownContainerRef (querySelectorAll heading, IntersectionObserver).
          // Lo zoom è passato come prop a MarkdownRenderer che lo applica
          // al suo div interno via style.zoom, senza mai toccare l'innerHTML
          // — i grafici SVG già renderizzati da Graphviz restano in DOM.
          <div ref={markdownContainerRef}>
            <MarkdownRenderer
              content={content || ""}
              className="note-markdown text-sm"
              style={{ userSelect: "text" }}
              enableAnchorLinks
              renderGraphviz
              scale={scale / 100}
            />
          </div>
        ),
      },
    ],
  };

  // ── Modalità Markdown su MOBILE: layout dedicato a tutto schermo ──────────
  // Contenuto con un solo scroll, Indice in un pannello a scomparsa (FAB) e
  // Strumenti in un pannello a scomparsa (menu in alto). Il desktop non cambia.
  if (isMobile) {
    if (!isOpen) return null;
    const zIndex = 1000 + modalDepth * 10;

    return (
      <>
        <div
          className="fixed inset-0 bg-bg-primary flex flex-col"
          style={{
            zIndex,
            paddingTop: "var(--safe-area-inset-top)",
            paddingBottom: "var(--safe-area-inset-bottom)",
          }}
        >
          {/* Header */}
          <header className="shrink-0 relative flex items-center gap-2 px-3 h-14 border-b border-divider">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-tertiary active:bg-divider transition-colors"
              aria-label="Chiudi"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="flex-1 text-base font-semibold text-text-primary text-center truncate px-1">
              {title || "Nota"}
            </h2>
            <button
              onClick={() => setIsMobileToolsOpen(true)}
              className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-tertiary active:bg-divider transition-colors"
              aria-label="Strumenti"
            >
              <MoreVerticalIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Contenuto markdown (scroll unico) */}
          <div
            ref={centerScrollRef}
            className="flex-1 overflow-y-auto overflow-x-auto overscroll-contain p-4"
          >
            <div ref={markdownContainerRef}>
              <MarkdownRenderer
                content={content || ""}
                className="note-markdown text-sm"
                style={{ userSelect: "text" }}
                enableAnchorLinks
                renderGraphviz
                scale={scale / 100}
              />
            </div>
          </div>
        </div>

        {/* FAB Indice */}
        {headings.length > 0 && (
          <button
            onClick={() => setIsMobileTocOpen(true)}
            className="fixed right-4 flex items-center gap-2 px-4 h-12 rounded-full bg-primary text-white shadow-lg active:scale-95 transition-transform"
            style={{
              zIndex: zIndex + 1,
              bottom: "calc(var(--safe-area-inset-bottom, 0px) + 16px)",
            }}
            aria-label="Apri indice"
          >
            <ListChecksIcon className="w-5 h-5" />
            <span className="text-sm font-semibold">Indice</span>
          </button>
        )}

        {/* Pannello Indice */}
        {isMobileTocOpen && (
          <div
            className="fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: zIndex + 2 }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileTocOpen(false)}
            />
            <div className="relative bg-bg-secondary rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-in-bottom">
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-divider">
                <h3 className="text-base font-semibold text-text-primary">
                  Indice
                </h3>
                <button
                  onClick={() => setIsMobileTocOpen(false)}
                  className="text-sm text-primary font-medium px-2 py-1"
                >
                  Chiudi
                </button>
              </div>
              <div className="overflow-y-auto p-3">
                <TocContent
                  headings={headings}
                  onHeadingClick={(slug) => {
                    setIsMobileTocOpen(false);
                    // Attende la chiusura del pannello prima di scorrere
                    setTimeout(() => handleHeadingClick(slug), 60);
                  }}
                  activeSlug={activeSlug}
                  favorites={favorites}
                  onFavoriteToggle={toggleFavorite}
                />
              </div>
            </div>
          </div>
        )}
        {/* Pannello Strumenti */}
        {isMobileToolsOpen && (
          <div
            className="fixed inset-0 flex flex-col justify-end"
            style={{ zIndex: zIndex + 2 }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileToolsOpen(false)}
            />
            <div className="relative bg-bg-secondary rounded-t-2xl flex flex-col animate-slide-in-bottom">
              <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-divider">
                <h3 className="text-base font-semibold text-text-primary">
                  Strumenti
                </h3>
                <button
                  onClick={() => setIsMobileToolsOpen(false)}
                  className="text-sm text-primary font-medium px-2 py-1"
                >
                  Chiudi
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {/* Zoom */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <ZoomInIcon className="w-5 h-5" />
                    <span className="text-sm">Zoom</span>
                  </div>
                  <div className="flex items-center bg-bg-tertiary rounded-xl p-0.5">
                    <button
                      onClick={() => setScale((s) => Math.max(50, s - 25))}
                      disabled={scale <= 50}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                      aria-label="Riduci scala"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-text-primary min-w-14 text-center tabular-nums">
                      {scale}%
                    </span>
                    <button
                      onClick={() => setScale((s) => Math.min(250, s + 25))}
                      disabled={scale >= 250}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                      aria-label="Aumenta scala"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="h-px bg-divider" />

                {/* Esporta PDF */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    handleExportPdf();
                  }}
                  disabled={isExporting || !content?.trim()}
                  className="flex items-center gap-2 w-full px-2 py-2.5 rounded-xl hover:bg-bg-tertiary active:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
                >
                  <DownloadIcon
                    className={`w-5 h-5 shrink-0 ${
                      isExporting ? "text-primary animate-pulse" : ""
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isExporting ? "text-primary font-medium" : ""
                    }`}
                  >
                    {isExporting ? "Generazione…" : "Esporta PDF"}
                  </span>
                </button>

                {/* Esporta MD */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileToolsOpen(false);
                    handleExportMd();
                  }}
                  disabled={!content?.trim()}
                  className="flex items-center gap-2 w-full px-2 py-2.5 rounded-xl hover:bg-bg-tertiary active:bg-divider disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
                >
                  <FileTextIcon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">Esporta MD</span>
                </button>

                {/* Modifica */}
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileToolsOpen(false);
                      onClose();
                      onEdit();
                    }}
                    className="flex items-center gap-2 w-full px-2 py-2.5 rounded-xl hover:bg-bg-tertiary active:bg-divider transition-colors text-text-primary"
                  >
                    <PencilIcon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">Modifica</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <SplitModal
      isOpen={isOpen}
      onClose={onClose}
      layout={layout}
      maxHeight="calc(100vh - 48px)"
    />
  );
};

export default NoteViewerModal;
