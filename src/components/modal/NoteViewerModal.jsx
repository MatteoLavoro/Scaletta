import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import Modal from "./Modal";
import SplitModal from "./SplitModal";
import MarkdownRenderer from "../ui/MarkdownRenderer";
import renderMarkdown from "../../utils/markdownRenderer";

// ─── Estrazione anchor link interni dal markdown renderizzato ────────────────

/**
 * Estrae gli anchor link interni (#slug) dall'HTML già renderizzato.
 * Vengono inclusi SOLO i link che puntano a sezioni interne del documento
 * (href="#..."), nell'ordine in cui compaiono nel sorgente — tipicamente
 * quelli elencati nella sezione "Indice" del file markdown.
 * I titoli non linkati esplicitamente vengono ignorati.
 *
 * La profondità (depth) viene ricavata dall'heading corrispondente per
 * preservare l'indentazione visiva nel pannello TOC.
 *
 * @returns {{ depth: number, text: string, slug: string }[]}
 */
function extractAnchorLinks(markdown) {
  if (!markdown || typeof DOMParser === "undefined") return [];
  try {
    const html = renderMarkdown(markdown);
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Mappa slug → profondità heading per preservare l'indentazione
    const depthMap = new Map();
    doc
      .querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
      .forEach((el) => depthMap.set(el.id, parseInt(el.tagName[1])));

    // Estrai anchor link interni, deduplicati, nell'ordine del documento
    const seen = new Set();
    const result = [];
    doc.querySelectorAll('a[href^="#"]').forEach((el) => {
      const slug = (el.getAttribute("href") || "").slice(1);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const text = el.textContent?.trim() || "";
      if (text) result.push({ depth: depthMap.get(slug) ?? 1, text, slug });
    });
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
const TocContent = ({ headings, onHeadingClick, activeSlug }) => {
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
        return (
          <button
            key={i}
            ref={isActive ? activeItemRef : null}
            onClick={() => onHeadingClick(h.slug)}
            title={h.text}
            className={`
              text-left text-xs leading-snug rounded-lg py-1.5 w-full truncate
              transition-colors duration-150
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
            {h.text}
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

  // Estrae gli anchor link interni dal markdown renderizzato (solo per markdown)
  const headings = useMemo(
    () => (contentType === "markdown" ? extractAnchorLinks(content) : []),
    [content, contentType],
  );

  // Slug del titolo attivo (evidenziato nel TOC)
  const [activeSlug, setActiveSlug] = useState(null);

  // Ref al div wrapper del MarkdownRenderer (per cercare heading by id)
  const markdownContainerRef = useRef(null);

  // Ref al div scrollabile del pannello centrale (esposto via contentRef di SplitModal)
  const centerScrollRef = useRef(null);

  // Scala di visualizzazione del contenuto markdown (50%–250%, step 25%)
  const [scale, setScale] = useState(100);

  // Click su voce TOC → scorre SOLO nel pannello centrale (non nel documento)
  const handleHeadingClick = useCallback((slug) => {
    const container = markdownContainerRef.current;
    if (!container) return;
    const el = container.querySelector(`[id="${CSS.escape(slug)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Traccia la posizione di lettura: evidenzia nel TOC la sezione corrente.
  //
  // Algoritmo: scroll-listener + rAF throttle.
  //   • Selettore h1-h6[id="slug"]: trova le DESTINAZIONI dei link (gli heading),
  //     non gli anchor <a href="#..."> della sezione Indice (le sorgenti).
  //   • Semantica "ultimo heading passato in cima": l'heading attivo è l'ultimo
  //     in ordine DOM la cui distanza dal bordo superiore del pannello è <= 8px.
  //     Non c'è break: si itera tutto l'array così l'ultimo valido vince sempre.
  //   • scale nei dep: quando cambia lo zoom il contenuto si sposta, l'effetto
  //     si riavvia e ricalcola subito la voce attiva con le nuove posizioni.
  //   • Alla chiusura del modale si azzera il slug (no stato stale alla riapertura).
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

    // Selettore che cerca SOLO h1-h6 con quegli id (la destinazione del link)
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

    const headingEls = Array.from(container.querySelectorAll(sel));
    if (!headingEls.length) {
      setActiveSlug(null);
      return;
    }

    let rafId = null;

    const handleScroll = () => {
      if (rafId !== null) return; // già in coda un frame
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const containerTop = scrollEl.getBoundingClientRect().top;
        // Cerca l'ultimo heading (ordine DOM) la cui top viewport è entro
        // 8px dal bordo superiore del pannello = sezione che il lettore ha
        // appena superato / sta leggendo.
        // Senza break: tutti gli elementi vengono controllati, l'ultimo
        // valido vince anche se i successivi non sono strettamente ordinati
        // per posizione Y (es. dopo un cambio di zoom).
        let activeEl = null;
        for (const el of headingEls) {
          if (el.getBoundingClientRect().top - containerTop <= 8) {
            activeEl = el;
          }
        }
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
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Scala
                </p>
                <div className="flex items-center bg-bg-tertiary rounded-2xl p-1">
                  <button
                    onClick={() => setScale((s) => Math.max(50, s - 25))}
                    disabled={scale <= 50}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                    aria-label="Riduci scala"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-text-primary min-w-16 text-center tabular-nums">
                    {scale}%
                  </span>
                  <button
                    onClick={() => setScale((s) => Math.min(250, s + 25))}
                    disabled={scale >= 250}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-text-primary hover:bg-divider active:bg-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none"
                    aria-label="Aumenta scala"
                  >
                    +
                  </button>
                </div>
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
