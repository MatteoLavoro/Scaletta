import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import Modal from "./Modal";
import SplitModal from "./SplitModal";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import renderMarkdown from "../../utils/markdownRenderer";
import { exportNoteToPdf } from "../../services/pdfExport";
import { DownloadIcon, FileTextIcon, PencilIcon, ZoomInIcon } from "../icons";

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
function extractTableOfContents(markdown) {
  if (!markdown || typeof DOMParser === "undefined") return [];
  try {
    const html = renderMarkdown(markdown);
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Estrai TUTTI gli heading h1-h6 con id
    const allHeadings = Array.from(
      doc.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"),
    ).map((el) => {
      // Verifica se l'heading contiene SOLO link interni (sezione indice)
      const hasOnlyInternalLinks = Array.from(el.childNodes).every(
        (node) =>
          (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) ||
          (node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "A" &&
            (node.getAttribute("href") || "").startsWith("#")),
      );

      return {
        id: el.id,
        text: el.textContent?.trim() || "",
        depth: parseInt(el.tagName[1]),
        hasOnlyInternalLinks,
      };
    });

    // Identifica dove finisce la sezione indice:
    // i primi heading CONSECUTIVI che contengono solo link interni
    let indexSectionEnd = 0;
    for (let i = 0; i < allHeadings.length; i++) {
      if (allHeadings[i].hasOnlyInternalLinks) {
        indexSectionEnd = i + 1;
      } else {
        break; // Fine della sezione indice
      }
    }

    // Ritorna solo gli heading dopo la sezione indice
    return allHeadings.slice(indexSectionEnd).map(({ id, text, depth }) => ({
      slug: id,
      text,
      depth,
    }));
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

  // Scala di visualizzazione del contenuto markdown (50%–250%, step 25%)
  const [scale, setScale] = useState(100);

  const [isExporting, setIsExporting] = useState(false);

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

  // Click su voce TOC → scorre SOLO nel pannello centrale (non nel documento)
  const handleHeadingClick = useCallback((slug) => {
    const container = markdownContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`[id="${CSS.escape(slug)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Traccia la posizione di lettura: evidenzia nel TOC la sezione attualmente visibile.
  //
  // Algoritmo:
  //   1. Se il titolo (heading) di una sezione è visibile nel viewport,
  //      evidenzia QUELLA sezione (scegli il primo titolo se più di uno).
  //   2. Se nessun titolo è visibile, evidenzia la sezione che occupa
  //      più spazio nel viewport.
  //   3. Ogni "sezione" va dal suo titolo al titolo successivo (o fine doc).
  //
  // Questo funziona sempre anche quando si salta tra paragrafi.
  // scale nei dep: quando cambia lo zoom il contenuto si sposta e il tracking
  // si riavvia per ricalcolare la posizione con le nuove coordinate.
  // Alla chiusura del modale si azzera il slug (evita stato stale).
  useEffect(() => {
    if (!isOpen) {
      setActiveSlug(null);
      return;
    }

    const scrollEl = centerScrollRef.current;
    const container = markdownContainerRef.current;
    if (!scrollEl || !container || !headings.length) {
      setActiveSlug(null);
      return;
    }

    // Selettore che cerca SOLO gli h1-h6 con gli id del TOC
    // (esclude gli heading della sezione indice, che non sono nel TOC)
    const sel = headings
      .flatMap(({ slug }) => {
        const e = CSS.escape(slug);
        return [
          `h1[id="${e}"]`,
          `h2[id="${e}"]`,
          `h3[id="${e}"]`,
          `h4[id="${e}"]`,
          `h5[id="${e}"]`,
          `h6[id="${e}"]`,
        ];
      })
      .join(", ");

    // Filtra gli heading che contengono solo link interni: sono heading dell'indice
    // (es. "## [Sezione 1](#sezione-1)") e hanno lo stesso id degli heading del contenuto.
    // Senza questo filtro il tracking si inceppa su di essi perché sono in cima al DOM.
    const headingEls = Array.from(container.querySelectorAll(sel)).filter(
      (el) => {
        const hasOnlyInternalLinks = Array.from(el.childNodes).every(
          (node) =>
            (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) ||
            (node.nodeType === Node.ELEMENT_NODE &&
              node.tagName === "A" &&
              (node.getAttribute("href") || "").startsWith("#")),
        );
        return !hasOnlyInternalLinks;
      },
    );
    if (!headingEls.length) {
      setActiveSlug(null);
      return;
    }

    let rafId = null;

    const handleScroll = () => {
      if (rafId !== null) return; // già in coda un frame
      rafId = requestAnimationFrame(() => {
        rafId = null;

        const viewportTop = scrollEl.getBoundingClientRect().top;
        const viewportBottom = scrollEl.getBoundingClientRect().bottom;

        let firstVisibleHeading = null;
        let mostRecentPassedHeading = null;
        let maxTopPassedHeading = -Infinity; // traccia il top massimo tra heading passati

        // Itera through all headings per trovare:
        // 1. Il primo heading VISIBILE nel viewport
        // 2. L'heading SOPRA al viewport il cui top è MASSIMO
        //    (quello più vicino al top del viewport = paragrafo più recente letto)
        for (const heading of headingEls) {
          const headingRect = heading.getBoundingClientRect();
          const headingTop = headingRect.top;

          // Se il titolo è visibile nel viewport
          if (headingTop >= viewportTop && headingTop < viewportBottom) {
            if (!firstVisibleHeading) {
              firstVisibleHeading = heading;
            }
          }

          // Se il titolo è SOPRA al top del viewport (lo hai già passato):
          // Scegli l'heading il cui top è MASSIMO (più vicino al top del viewport).
          // Questo è il paragrafo che stai attualmente leggendo.
          if (headingTop < viewportTop && headingTop > maxTopPassedHeading) {
            maxTopPassedHeading = headingTop;
            mostRecentPassedHeading = heading;
          }
        }

        // Priorità: se un titolo è visibile nel viewport, usalo.
        // Altrimenti, usa il paragrafo più recente che hai letto (il cui titolo è più vicino).
        const activeEl = firstVisibleHeading || mostRecentPassedHeading;
        setActiveSlug(activeEl?.id ?? null);
      });
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // stato iniziale immediato all'apertura
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isOpen, headings, scale]);

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
