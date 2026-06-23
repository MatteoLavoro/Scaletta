import { useMemo, useEffect, useRef } from "react";
import renderMarkdown from "../../utils/markdownRenderer";

// Cache del modulo @viz-js/viz — il file WASM viene scaricato e compilato
// dal browser una sola volta, ma l'istanza Viz viene ricreata ad ogni rendering
// per evitare problemi di stato tra aperture successive del viewer.
let vizModulePromise = null;

// Mappa per tenere traccia degli interval dei puntini animati (el → intervalId)
const dotTimers = new Map();

// ─── Utilità colori per il tema SVG ────────────────────────────────────────────

/**
 * Converte una stringa colore SVG/Graphviz in {r, g, b} o null.
 * Supporta: "black", "white", #rrggbb, #rgb
 */
function parseHexColor(colorStr) {
  if (!colorStr) return null;
  const s = colorStr.toLowerCase().trim();
  if (s === "black") return { r: 0, g: 0, b: 0 };
  if (s === "white") return { r: 255, g: 255, b: 255 };
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(s);
  if (m6)
    return {
      r: parseInt(m6[1], 16),
      g: parseInt(m6[2], 16),
      b: parseInt(m6[3], 16),
    };
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(s);
  if (m3)
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16),
    };
  return null;
}

/**
 * Calcola la luminanza relativa WCAG (0 = nero, 1 = bianco).
 * Luminanza < 0.179 → sfondo scuro → il testo chiaro è necessario.
 */
function getLuminance({ r, g, b }) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

// Insiemi colori usati da Graphviz come default
const FILL_NONE = new Set(["none", "transparent", ""]);
const FILL_WHITE = new Set(["white", "#ffffff", "#FFFFFF", "#fff", "#FFF"]);
const FILL_BLACK = new Set(["black", "#000000", "#000"]);

/**
 * Carica il modulo @viz-js/viz (cache: una sola richiesta di rete/compilazione WASM
 * per sessione). NON cachea l'istanza Viz: ogni chiamata a .then(mod => mod.instance())
 * crea un'istanza fresca, evitando problemi di stato tra aperture successive.
 */
function getVizModule() {
  if (!vizModulePromise) {
    vizModulePromise = import("@viz-js/viz").catch((err) => {
      vizModulePromise = null; // reset per riprovare al prossimo tentativo
      throw err;
    });
  }
  return vizModulePromise;
}

// Avvia animazione puntini ". .. ..." su un elemento <span class="graphviz-dots">
function startDotsAnimation(dotsEl) {
  if (!dotsEl) return;
  const variants = [" .", " ..", " ..."];
  let idx = 0;
  dotsEl.textContent = variants[0];
  const id = setInterval(() => {
    if (!dotsEl.isConnected) {
      clearInterval(id);
      return;
    }
    idx = (idx + 1) % variants.length;
    dotsEl.textContent = variants[idx];
  }, 400);
  return id;
}

// Ferma animazione puntini per un placeholder
function stopDotsAnimation(el) {
  if (dotTimers.has(el)) {
    clearInterval(dotTimers.get(el));
    dotTimers.delete(el);
  }
}

/**
 * Post-processa un SVGElement generato da Graphviz per adattarlo al tema UI.
 *
 * - Rende trasparente il polygon di sfondo canvas
 * - Applica il font di sistema a tutti i testi
 * - Corregge il contrasto di TUTTI i testi in base al colore di sfondo:
 *   • Nodi trasparenti/bianchi → testo usa var(--color-text-primary) (segue il tema)
 *   • Nodi con colore scuro personalizzato (luminanza < soglia WCAG) → testo bianco
 *   • Titolo grafo e label cluster (sul canvas) → var(--color-text-primary)
 *   • Etichette archi (sul canvas) → var(--color-text-primary)
 * - Riduce leggermente il font delle etichette archi
 */
function applyThemeToSVG(svgElement) {
  // 1. Background canvas → trasparente
  const graphGroup = svgElement.querySelector("g.graph");
  if (graphGroup) {
    const canvasPolygon = graphGroup.querySelector(":scope > polygon");
    if (canvasPolygon) {
      canvasPolygon.setAttribute("fill", "transparent");
      canvasPolygon.setAttribute("stroke", "transparent");
    }
  }

  // 2. Font di sistema per tutti i testi
  svgElement.querySelectorAll("text, tspan").forEach((el) => {
    /** @type {HTMLElement} */ (el).style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  });

  // 3. Colore testo dei nodi — calcolato in base al fillcolor del nodo.
  //
  //    Graphviz emette sempre fill="black" per il testo; il colore dello SFONDO
  //    del nodo determina se quel testo è leggibile.
  //
  //    Casistica:
  //    • fill="none" / trasparente  → testo sul canvas → usa text-primary
  //    • fill="white" (default)     → CSS lo converte in bg-secondary in dark mode
  //                                   → usa text-primary (si adatta al tema)
  //    • fill personalizzato chiaro → testo nero già leggibile, non toccare
  //    • fill personalizzato scuro  → luminanza < 0.179 (soglia WCAG 4.5:1 con bianco)
  //                                   → testo bianco fisso
  svgElement.querySelectorAll("g.node").forEach((nodeGroup) => {
    const shape = nodeGroup.querySelector("ellipse, rect, polygon, circle");
    const fillAttr = shape?.getAttribute("fill") ?? "";

    let targetTextFill;

    if (FILL_NONE.has(fillAttr)) {
      // Nodo senza sfondo → testo è sul canvas → segue il tema
      targetTextFill = "var(--color-text-primary)";
    } else if (FILL_WHITE.has(fillAttr)) {
      // Nodo bianco default → CSS lo scurirà in dark mode → segue il tema
      targetTextFill = "var(--color-text-primary)";
    } else {
      // Colore personalizzato → calcola luminanza WCAG
      const color = parseHexColor(fillAttr);
      if (color && getLuminance(color) < 0.179) {
        // Sfondo scuro → testo bianco (leggibile su tutti i temi)
        targetTextFill = "#ffffff";
      }
      // Sfondo chiaro → testo nero già leggibile, nessuna modifica
    }

    if (targetTextFill) {
      nodeGroup.querySelectorAll("text, tspan").forEach((el) => {
        const tf = el.getAttribute("fill") ?? "";
        // Modifica solo testo nero/non impostato; preserva colori personalizzati utente
        if (FILL_BLACK.has(tf) || tf === "") {
          /** @type {HTMLElement} */ (el).style.fill = targetTextFill;
        }
      });
    }
  });

  // 4. Testo direttamente sul canvas: titolo del grafo e label dei cluster.
  //    Graphviz li emette con fill="black" → invisibili in dark mode.
  svgElement
    .querySelectorAll("g.graph > text, g.cluster > text")
    .forEach((el) => {
      const tf = el.getAttribute("fill") ?? "";
      if (FILL_BLACK.has(tf) || tf === "") {
        /** @type {HTMLElement} */ (el).style.fill =
          "var(--color-text-primary)";
      }
    });

  // 5. Etichette archi → sempre sul canvas → usa text-primary
  //    (Gestito anche da CSS, ma l'inline style ha priorità e vale come source of truth)
  svgElement.querySelectorAll("g.edge text, g.edge tspan").forEach((el) => {
    const tf = el.getAttribute("fill") ?? "";
    if (FILL_BLACK.has(tf) || tf === "") {
      /** @type {HTMLElement} */ (el).style.fill = "var(--color-text-primary)";
    }
  });

  // 6. Riduzione font etichette archi per meno sovrapposizioni
  svgElement.querySelectorAll("g.edge text").forEach((el) => {
    const size = parseFloat(el.getAttribute("font-size") || "0");
    if (size > 9) {
      const reduced = Math.max(8, Math.round(size * 0.85 * 2) / 2);
      if (reduced < size) el.setAttribute("font-size", String(reduced));
    }
  });
}

// Icona grafo inline SVG (usata nei placeholder preview)
const GRAPH_ICON_HTML =
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ` +
  `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>` +
  `<line x1="8.59" y1="13.51" x2="15.42" y2="6.49"/><line x1="8.59" y1="10.49" x2="15.42" y2="17.51"/>` +
  `</svg>`;

// Icona chevron-right inline SVG (usata nei placeholder preview cliccabili — indica "tocca per aprire")
const EXPAND_ICON_HTML =
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ` +
  `fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="m9 18 6-6-6-6"/>` +
  `</svg>`;

/**
 * MarkdownRenderer — component React per contenuto Markdown.
 *
 * @param {string}   content                  - Testo Markdown da renderizzare
 * @param {string}   [className]              - Classi CSS aggiuntive sul wrapper
 * @param {object}   [style]                  - Style inline aggiuntivo sul wrapper
 * @param {boolean}  [enableAnchorLinks=false]    - Abilita scroll su click #link
 * @param {boolean}  [renderGraphviz=false]        - Se true renderizza i grafi DOT via WASM;
 *                                                   se false mostra un placeholder statico
 * @param {function} [onGraphPreviewClick]          - Callback chiamata con il codice DOT quando
 *                                                   si clicca su un grafico in modalità preview.
 *                                                   Se fornita, i placeholder diventano cliccabili.
 */
const MarkdownRenderer = ({
  content,
  className,
  style,
  enableAnchorLinks = false,
  renderGraphviz = false,
  onGraphPreviewClick,
}) => {
  const containerRef = useRef(null);
  const rawHtml = useMemo(() => renderMarkdown(content || ""), [content]);

  // Booleano stabile: true se siamo in preview mode con callback fornita.
  // Usato come dep di displayHtml (boolean, non cambia reference ad ogni render).
  const hasGraphPreviewCallback = !renderGraphviz && !!onGraphPreviewClick;

  // Genera l'HTML finale incluso il contenuto dei placeholder graphviz.
  //
  // MODALITÀ PREVIEW (!renderGraphviz): i placeholder vengono sostituiti con le
  // preview box GIÀ in questo useMemo (sincrono, prima del paint). In questo modo
  // dangerouslySetInnerHTML contiene i bottoni fin dal primo render, eliminando
  // il flash che si avrebbe facendolo in useEffect (asincrono, post-paint).
  //
  // MODALITÀ VIEWER (renderGraphviz): i placeholder restano vuoti perché l'effect
  // WASM li sostituisce con gli SVG renderizzati.
  const displayHtml = useMemo(() => {
    if (renderGraphviz) return rawHtml;

    return rawHtml.replace(
      /<div class="graphviz-placeholder" data-dot="([^"]+)"><\/div>/g,
      (_, encoded) => {
        const extraClass = hasGraphPreviewCallback
          ? " graphviz-preview-clickable"
          : "";
        const ctaHtml = hasGraphPreviewCallback
          ? `<div class="graphviz-preview-cta">${EXPAND_ICON_HTML}</div>`
          : "";
        const titleText = "Grafico incorporato";
        const subText = hasGraphPreviewCallback
          ? "Tocca per aprire"
          : "Apri la nota per visualizzare";
        const subClass = hasGraphPreviewCallback
          ? "graphviz-preview-sub graphviz-preview-sub--cta"
          : "graphviz-preview-sub";
        return (
          `<div class="graphviz-placeholder graphviz-preview-mode${extraClass}" data-dot="${encoded}">` +
          `<div class="graphviz-preview-box">` +
          `<div class="graphviz-preview-icon-wrap">${GRAPH_ICON_HTML}</div>` +
          `<div class="graphviz-preview-body">` +
          `<span class="graphviz-preview-title">${titleText}</span>` +
          `<span class="${subClass}">${subText}</span>` +
          `</div>` +
          ctaHtml +
          `</div></div>`
        );
      },
    );
  }, [rawHtml, renderGraphviz, hasGraphPreviewCallback]);

  // Ref per la callback di preview click: sempre aggiornato, utilizzabile
  // nell'onClick React senza dipendenze da closure stale.
  const onGraphPreviewClickRef = useRef(onGraphPreviewClick);
  onGraphPreviewClickRef.current = onGraphPreviewClick;

  // ── Graphviz ────────────────────────────────────────────────────────────────
  //
  // Il flag `cancelled` risolve il bug "secondo open non carica":
  // quando vizPromise è già risolta (WASM in cache), il .then() si esegue come
  // microtask. In React StrictMode il cleanup del primo run (cancelled=true)
  // scatta PRIMA che il microtask giri, impedendo renderingi da run obsoleti.
  // Il secondo run dell'effect crea un nuovo `cancelled=false` e renderizza
  // correttamente.
  useEffect(() => {
    const container = containerRef.current;
    // La modalità preview è gestita interamente da displayHtml (useMemo sincrono):
    // nessuna manipolazione DOM necessaria in questo effect.
    if (!container || !renderGraphviz) return;

    const placeholders = /** @type {NodeListOf<HTMLElement>} */ (
      container.querySelectorAll(".graphviz-placeholder")
    );
    if (placeholders.length === 0) return;

    const total = placeholders.length;

    // ── Viewer mode: loading box → SVG ──
    let cancelled = false;

    placeholders.forEach((el, i) => {
      // Se ha già un SVG o è già renderizzato, NON toccare.
      if (el.classList.contains("graphviz-rendered") || el.querySelector("svg"))
        return;
      const label = total > 1 ? `Grafico ${i + 1} di ${total}` : "Grafico";
      el.innerHTML =
        `<div class="graphviz-loading-box">` +
        `<div class="graphviz-loading-icon">${GRAPH_ICON_HTML}</div>` +
        `<div class="graphviz-loading-text">` +
        `Caricamento ${label}<span class="graphviz-dots"></span>` +
        `</div>` +
        `</div>`;
      const dotsEl = el.querySelector(".graphviz-dots");
      const timerId = startDotsAnimation(dotsEl);
      if (timerId !== undefined) dotTimers.set(el, timerId);
    });

    // Nuova istanza Viz ad ogni rendering: mod.instance() è rapido (WASM già
    // compilato in cache dal browser), ma garantisce stato pulito ad ogni apertura.
    getVizModule()
      .then((mod) => {
        if (cancelled) return null;
        return mod.instance();
      })
      .then((viz) => {
        if (!viz || cancelled) return;

        // Usa la variabile `container` dalla closure invece di containerRef.current:
        // il ref può essere nullificato temporaneamente da React StrictMode durante
        // la fase "fake unmount", mentre il DOM element rimane nel documento.
        if (!container.isConnected) return;

        const toRender = /** @type {NodeListOf<HTMLElement>} */ (
          container.querySelectorAll(
            ".graphviz-placeholder:not(.graphviz-rendered):not(.graphviz-preview-mode)",
          )
        );
        const count = toRender.length;
        if (count === 0) return;

        toRender.forEach((el, i) => {
          if (cancelled) return;

          // Assicura che ci sia un loading box
          if (
            !el.querySelector(".graphviz-loading-box") &&
            !el.querySelector("svg")
          ) {
            const label =
              count > 1 ? `Grafico ${i + 1} di ${count}` : "Grafico";
            el.innerHTML =
              `<div class="graphviz-loading-box">` +
              `<div class="graphviz-loading-icon">${GRAPH_ICON_HTML}</div>` +
              `<div class="graphviz-loading-text">` +
              `Caricamento ${label}<span class="graphviz-dots"></span>` +
              `</div>` +
              `</div>`;
          }

          const dot = decodeURIComponent(el.getAttribute("data-dot") || "");
          if (!dot) return;

          try {
            const svgElement = viz.renderSVGElement(dot);
            applyThemeToSVG(svgElement);
            svgElement.setAttribute("width", "100%");
            svgElement.removeAttribute("height");
            svgElement.style.overflow = "visible";

            stopDotsAnimation(el);
            el.innerHTML = "";
            el.appendChild(svgElement);
            el.classList.add("graphviz-rendered");
          } catch (err) {
            console.error(
              `[Graphviz] ❌ Grafico ${i + 1}/${count} — errore rendering:`,
              err,
            );
            stopDotsAnimation(el);
            const msg = String(err?.message ?? err)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            el.innerHTML =
              `<div class="graphviz-error">` +
              `<strong>Errore Graphviz</strong><pre>${msg}</pre>` +
              `</div>`;
            el.classList.add("graphviz-rendered");
          }
        });
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Graphviz] ❌ Impossibile caricare Graphviz:", err);
        if (!container.isConnected) return;
        const msg = String(err?.message ?? err)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        container
          .querySelectorAll(
            ".graphviz-placeholder:not(.graphviz-rendered):not(.graphviz-preview-mode)",
          )
          .forEach((el) => {
            stopDotsAnimation(el);
            /** @type {HTMLElement} */ (el).innerHTML =
              `<div class="graphviz-error">Impossibile caricare Graphviz: ${msg}</div>`;
            /** @type {HTMLElement} */ (el).classList.add("graphviz-rendered");
          });
      });

    return () => {
      cancelled = true;
      placeholders.forEach((el) => stopDotsAnimation(el));
    };
  }, [rawHtml, renderGraphviz]);

  // ── Anchor links ─────────────────────────────────────────────────────────────
  // Gestisce sia anchor links che click sui placeholder grafico (event delegation).
  const handleClick =
    enableAnchorLinks || hasGraphPreviewCallback
      ? (e) => {
          // Anchor links (#sezione)
          if (enableAnchorLinks) {
            const anchor = e.target.closest("a");
            if (anchor) {
              const href = anchor.getAttribute("href");
              if (href?.startsWith("#")) {
                e.preventDefault();
                const target = containerRef.current?.querySelector(
                  `[id="${CSS.escape(href.slice(1))}"]`,
                );
                target?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
            }
          }
          // Click su placeholder grafico cliccabile
          if (hasGraphPreviewCallback) {
            const placeholder = e.target.closest(".graphviz-preview-clickable");
            if (placeholder) {
              e.stopPropagation();
              const dot = decodeURIComponent(
                placeholder.getAttribute("data-dot") || "",
              );
              if (dot) onGraphPreviewClickRef.current?.(dot);
            }
          }
        }
      : undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
      onClick={handleClick}
    />
  );
};

export default MarkdownRenderer;
