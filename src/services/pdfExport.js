/**
 * pdfExport.js — Servizio di esportazione PDF per note Markdown
 *
 * Flusso:
 *  1. Renderizza il Markdown in HTML (già disponibile via markdownRenderer)
 *  2. Pre-renderizza tutti i grafici Graphviz DOT → SVG (via @viz-js/viz WASM)
 *     e post-processa gli SVG per il tema chiaro (colori fissi, non CSS var)
 *  3. Costruisce un documento HTML completo e autocontenuto con CSS light-theme
 *  4. Apre il documento in una nuova finestra e lancia il dialogo di stampa
 *     → l'utente sceglie "Salva come PDF" dal dialogo nativo del browser
 *
 * Vantaggi di questo approccio vs. librerie esterne (jsPDF, html2canvas…):
 *  - Testo realmente selezionabile nel PDF (rendering nativo del browser)
 *  - SVG vettoriali perfetti per i grafici Graphviz
 *  - Stili CSS completi: tabelle, codice, formule KaTeX, list ecc.
 *  - Nessuna dipendenza aggiuntiva (usa @viz-js/viz già presente nel progetto)
 *  - Compatibile con tutte le piattaforme (Chrome, Firefox, Safari, Edge)
 */

import renderMarkdown from "../utils/markdownRenderer";

// ─── Cache modulo @viz-js/viz (condivisa con MarkdownRenderer) ──────────────
let vizModulePromise = null;

function getVizModule() {
  if (!vizModulePromise) {
    vizModulePromise = import("@viz-js/viz").catch((err) => {
      vizModulePromise = null;
      throw err;
    });
  }
  return vizModulePromise;
}

// ─── Utilità colori per post-processing SVG light-theme ─────────────────────

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

function getLuminance({ r, g, b }) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const PDF_FILL_NONE = new Set(["none", "transparent", ""]);
const PDF_FILL_WHITE = new Set(["white", "#ffffff", "#FFFFFF", "#fff", "#FFF"]);
const PDF_FILL_BLACK = new Set(["black", "#000000", "#000"]);

// Colori fissi per il PDF (tema chiaro sempre)
const PDF_TEXT_DARK = "#1a1a2e"; // Testo su sfondo bianco/chiaro
const PDF_TEXT_WHITE = "#ffffff"; // Testo su sfondo scuro

/**
 * Post-processa un SVGElement generato da Graphviz per il tema chiaro del PDF.
 * A differenza di applyThemeToSVG (che usa var(--color-text-primary)),
 * qui usiamo colori fissi perché il documento PDF non ha il foglio di stile dell'app.
 */
function applyPdfThemeToSVG(svgElement) {
  // 1. Canvas background → bianco puro (leggibile su carta)
  const graphGroup = svgElement.querySelector("g.graph");
  if (graphGroup) {
    const canvasPolygon = graphGroup.querySelector(":scope > polygon");
    if (canvasPolygon) {
      canvasPolygon.setAttribute("fill", "#ffffff");
      canvasPolygon.setAttribute("stroke", "#d1d5db");
    }
  }

  // 2. Font di sistema per tutti i testi
  svgElement.querySelectorAll("text, tspan").forEach((el) => {
    el.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  });

  // 3. Colore testo dei nodi basato sulla luminanza del fillcolor
  svgElement.querySelectorAll("g.node").forEach((nodeGroup) => {
    const shape = nodeGroup.querySelector("ellipse, rect, polygon, circle");
    const fillAttr = shape?.getAttribute("fill") ?? "";

    let targetTextFill;

    if (PDF_FILL_NONE.has(fillAttr) || PDF_FILL_WHITE.has(fillAttr)) {
      // Nodo trasparente o bianco → testo scuro su sfondo chiaro
      targetTextFill = PDF_TEXT_DARK;
    } else {
      // Colore personalizzato → calcola luminanza WCAG
      const color = parseHexColor(fillAttr);
      if (color && getLuminance(color) < 0.179) {
        // Sfondo scuro → testo bianco
        targetTextFill = PDF_TEXT_WHITE;
      } else {
        // Sfondo chiaro → testo scuro
        targetTextFill = PDF_TEXT_DARK;
      }
    }

    if (targetTextFill) {
      nodeGroup.querySelectorAll("text, tspan").forEach((el) => {
        const tf = el.getAttribute("fill") ?? "";
        if (PDF_FILL_BLACK.has(tf) || tf === "") {
          el.style.fill = targetTextFill;
        }
      });
    }
  });

  // 4. Testo del titolo grafo e label cluster → testo scuro
  svgElement
    .querySelectorAll("g.graph > text, g.cluster > text")
    .forEach((el) => {
      const tf = el.getAttribute("fill") ?? "";
      if (PDF_FILL_BLACK.has(tf) || tf === "") {
        el.style.fill = PDF_TEXT_DARK;
      }
    });

  // 5. Etichette archi → testo scuro
  svgElement.querySelectorAll("g.edge text, g.edge tspan").forEach((el) => {
    const tf = el.getAttribute("fill") ?? "";
    if (PDF_FILL_BLACK.has(tf) || tf === "") {
      el.style.fill = PDF_TEXT_DARK;
    }
  });

  // 6. Linee e bordi degli archi → grigio scuro (leggibili su carta bianca)
  svgElement.querySelectorAll("g.edge path, g.edge polygon").forEach((el) => {
    const stroke = el.getAttribute("stroke") ?? "";
    if (PDF_FILL_BLACK.has(stroke) || stroke === "") {
      el.setAttribute("stroke", "#374151");
    }
    const fill = el.getAttribute("fill") ?? "";
    if (PDF_FILL_BLACK.has(fill)) {
      el.setAttribute("fill", "#374151");
    }
  });

  // 7. Bordi dei nodi trasparenti/bianchi → grigio chiaro (visibili su carta)
  svgElement.querySelectorAll("g.node").forEach((nodeGroup) => {
    const shape = nodeGroup.querySelector("ellipse, rect, polygon, circle");
    if (!shape) return;
    const fillAttr = shape.getAttribute("fill") ?? "";
    const strokeAttr = shape.getAttribute("stroke") ?? "";
    if (PDF_FILL_NONE.has(fillAttr) || PDF_FILL_WHITE.has(fillAttr)) {
      if (PDF_FILL_BLACK.has(strokeAttr) || strokeAttr === "") {
        shape.setAttribute("stroke", "#6b7280");
      }
    }
  });

  // 8. Riduzione font etichette archi
  svgElement.querySelectorAll("g.edge text").forEach((el) => {
    const size = parseFloat(el.getAttribute("font-size") || "0");
    if (size > 9) {
      const reduced = Math.max(8, Math.round(size * 0.85 * 2) / 2);
      if (reduced < size) el.setAttribute("font-size", String(reduced));
    }
  });
}

/**
 * Renderizza tutti i placeholder Graphviz nell'HTML in SVG reali.
 * Restituisce l'HTML con i placeholder sostituiti dagli SVG inline.
 *
 * @param {string} html - HTML con elementi graphviz-placeholder
 * @returns {Promise<string>} HTML con SVG inline al posto dei placeholder
 */
async function renderGraphvizInHtml(html) {
  // Crea un div temporaneo per parsare l'HTML e trovare i placeholder
  const tmpDiv = document.createElement("div");
  tmpDiv.innerHTML = html;

  const placeholders = tmpDiv.querySelectorAll(".graphviz-placeholder");
  if (placeholders.length === 0) return html;

  // Carica @viz-js/viz e crea un'istanza pulita
  const vizMod = await getVizModule();
  const viz = await vizMod.instance();

  for (const placeholder of placeholders) {
    const encoded = placeholder.getAttribute("data-dot");
    if (!encoded) continue;

    let dotSource;
    try {
      dotSource = decodeURIComponent(encoded);
    } catch {
      continue;
    }

    try {
      const svgStr = viz.renderString(dotSource, { format: "svg" });

      // Parsa l'SVG string in un elemento DOM reale
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgStr, "image/svg+xml");
      const svgEl = svgDoc.querySelector("svg");

      if (!svgEl) continue;

      // ── Scaling grafi ──────────────────────────────────────────────────────
      // Graphviz emette le dimensioni in pt (es. "400pt").
      // Applichiamo DUE fattori di scala (il più restrittivo vince):
      //
      // 1) FONT-SIZE: se il testo supera il default Graphviz (14pt) il grafo
      //    verrebbe enorme nel PDF. Riduciamo finché il font è ~11pt.
      //    Grafi con font piccolo (≤14pt) restano invariati.
      //
      // 2) DIMENSIONI: un grafo più alto che largo può occupare più pagine.
      //    Limitiamo l'altezza a PDF_MAX_H pt e la larghezza a PDF_MAX_W pt.
      //    Grafi più larghi che alti (landscape) non vengono scalati per altezza.
      //    La larghezza massima è comunque garantita da max-width:100% nel CSS.

      const DEFAULT_GV_FONT = 14; // pt, default Graphviz
      const TARGET_MAX_FONT = 11; // pt, circa corpo PDF (10pt base)

      // A4 con margini 20/22mm → area utile ~166×255mm → ~470×722pt
      // Limitiamo i grafi a valori confortevoli: larghezza piena, altezza ~60% pagina
      const PDF_MAX_W = 450; // pt
      const PDF_MAX_H = 480; // pt (circa 2/3 della pagina A4)

      // Leggi dimensioni originali (Graphviz: "NNpt")
      const rawW = svgEl.getAttribute("width") || "";
      const rawH = svgEl.getAttribute("height") || "";
      const naturalW = parseFloat(rawW); // 0 se non presente
      const naturalH = parseFloat(rawH); // 0 se non presente

      // Font-size massimo tra tutti i testi del grafo
      let maxFontSize = DEFAULT_GV_FONT;
      svgEl.querySelectorAll("text").forEach((el) => {
        const fs = parseFloat(el.getAttribute("font-size") || "0");
        if (fs > maxFontSize) maxFontSize = fs;
      });

      // Scala per font-size: solo se font > default Graphviz
      const fontScale =
        maxFontSize > DEFAULT_GV_FONT
          ? Math.max(0.3, TARGET_MAX_FONT / maxFontSize)
          : 1;

      // Scala per altezza: solo se il grafo è più alto che largo (portrait)
      // e supera il limite di altezza
      let dimScale = 1;
      if (naturalW > 0 && naturalH > 0) {
        const isPortrait = naturalH > naturalW;
        if (isPortrait && naturalH > PDF_MAX_H) {
          // Scala per altezza (mantiene aspect ratio)
          dimScale = PDF_MAX_H / naturalH;
          // Verifica che dopo la scala non superi neanche la larghezza
          if (naturalW * dimScale > PDF_MAX_W) {
            dimScale = PDF_MAX_W / naturalW;
          }
        } else if (!isPortrait && naturalW > PDF_MAX_W) {
          // Grafo landscape molto largo: max-width CSS lo gestisce,
          // ma impostiamo comunque la larghezza per coerenza con il calcolo
          dimScale = PDF_MAX_W / naturalW;
        }
      }

      // Scala finale: la più restrittiva tra font-scale e dim-scale
      const scale = Math.min(fontScale, dimScale);

      // Applica il tema chiaro per PDF
      applyPdfThemeToSVG(svgEl);

      // Rimuovi attributi nativi e applica sizing con scala
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      if (scale < 1 && naturalW > 0) {
        svgEl.style.width = `${Math.round(naturalW * scale)}pt`;
        // height:auto deriva dall'aspect ratio del viewBox (non serve impostarlo)
      }
      svgEl.style.maxWidth = "100%";
      svgEl.style.height = "auto";
      svgEl.style.display = "inline-block";

      // Costruisci il wrapper
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-graphviz-wrap";
      wrapper.appendChild(svgEl.cloneNode(true));

      placeholder.replaceWith(wrapper);
    } catch (err) {
      // In caso di errore, sostituisci con un box di errore non bloccante
      const errBox = document.createElement("div");
      errBox.className = "pdf-graphviz-error";
      errBox.textContent = `⚠ Impossibile renderizzare il grafico: ${err?.message || "errore sconosciuto"}`;
      placeholder.replaceWith(errBox);
    }
  }

  return tmpDiv.innerHTML;
}

// ─── CSS del documento PDF ────────────────────────────────────────────────────

function buildPdfCss() {
  return `
    /* ── Reset e base ──────────────────────────────────────────────────────── */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --pdf-text-primary:   #1a1a2e;
      --pdf-text-secondary: #374151;
      --pdf-text-muted:     #6b7280;
      --pdf-accent:         #0097a7;
      --pdf-bg:             #ffffff;
      --pdf-bg-code:        #f8fafc;
      --pdf-bg-table-head:  #f1f5f9;
      --pdf-border:         #e2e8f0;
      --pdf-border-code:    #d1d5db;
      --pdf-font-size:      10pt;
      --pdf-line-height:    1.65;
    }

    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter",
                   Roboto, Oxygen, Ubuntu, "Helvetica Neue", Arial, sans-serif;
      font-size: var(--pdf-font-size);
      line-height: var(--pdf-line-height);
      color: var(--pdf-text-primary);
      background: var(--pdf-bg);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* ── Layout pagina ────────────────────────────────────────────────────── */
    @page {
      size: A4;
      margin: 20mm 22mm 22mm 22mm;
      /* Sovrascrive intestazioni/piè pagina predefiniti del browser (data, URL, titolo) */
      @top-left     { content: ""; }
      @top-center   { content: ""; }
      @top-right    { content: ""; }
      @bottom-left  { content: ""; }
      @bottom-right { content: ""; }
      @bottom-center {
        content: counter(page) " di " counter(pages);
        font-size: 7.5pt;
        color: #9ca3af;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
    }

    .pdf-document {
      max-width: 100%;
    }

    /* ── Corpo del documento ──────────────────────────────────────────────── */
    .pdf-body {
      font-size: var(--pdf-font-size);
      line-height: var(--pdf-line-height);
    }

    /* Nessun margine-top per il primo elemento del corpo ── */
    .pdf-body > *:first-child {
      margin-top: 0 !important;
    }

    /* ── Titoli ───────────────────────────────────────────────────────────── */
    .pdf-body h1,
    .pdf-body h2,
    .pdf-body h3,
    .pdf-body h4,
    .pdf-body h5,
    .pdf-body h6 {
      color: var(--pdf-text-primary);
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.6em;
      margin-bottom: 0.5em;
      break-after: avoid;
      letter-spacing: -0.01em;
    }

    .pdf-body h1 {
      font-size: 16pt;
      border-bottom: 1.5px solid var(--pdf-border);
      padding-bottom: 0.3em;
    }

    .pdf-body h2 {
      font-size: 13pt;
      border-bottom: 1px solid var(--pdf-border);
      padding-bottom: 0.25em;
    }

    .pdf-body h3 {
      font-size: 11.5pt;
    }

    .pdf-body h4,
    .pdf-body h5,
    .pdf-body h6 {
      font-size: 10pt;
      color: var(--pdf-text-secondary);
    }

    /* ── Paragrafi ────────────────────────────────────────────────────────── */
    .pdf-body p {
      color: var(--pdf-text-secondary);
      margin-bottom: 0.75em;
      orphans: 3;
      widows: 3;
    }

    /* ── Testo enfatizzato ────────────────────────────────────────────────── */
    .pdf-body strong, .pdf-body b {
      font-weight: 700;
      color: var(--pdf-text-primary);
    }

    .pdf-body em, .pdf-body i {
      font-style: italic;
    }

    .pdf-body del, .pdf-body s {
      text-decoration: line-through;
      color: var(--pdf-text-muted);
    }

    /* ── Link ──────────────────────────────────────────────────────────────── */
    .pdf-body a {
      color: var(--pdf-accent);
      text-decoration: underline;
      text-underline-offset: 2px;
      word-break: break-word;
    }

    /* ── Liste ────────────────────────────────────────────────────────────── */
    .pdf-body ul,
    .pdf-body ol {
      color: var(--pdf-text-secondary);
      padding-left: 1.5em;
      margin-bottom: 0.75em;
      line-height: var(--pdf-line-height);
    }

    .pdf-body ul { list-style-type: disc; }
    .pdf-body ol { list-style-type: decimal; }

    .pdf-body li {
      margin-bottom: 0.2em;
    }

    .pdf-body li > p {
      margin-bottom: 0.2em;
    }

    /* Task list */
    .pdf-body input[type="checkbox"] {
      margin-right: 0.4em;
    }

    /* ── Citazioni ────────────────────────────────────────────────────────── */
    .pdf-body blockquote {
      border-left: 3px solid var(--pdf-accent);
      padding-left: 0.875em;
      margin: 0.75em 0;
      color: var(--pdf-text-muted);
      font-style: italic;
      break-inside: avoid;
    }

    .pdf-body blockquote p {
      color: var(--pdf-text-muted);
      margin-bottom: 0;
    }

    /* ── Riga orizzontale ────────────────────────────────────────────────── */
    .pdf-body hr {
      border: none;
      border-top: 1px solid var(--pdf-border);
      margin: 1.25em 0;
    }

    /* ── Codice inline ───────────────────────────────────────────────────── */
    .pdf-body code {
      background: var(--pdf-bg-code);
      color: #0f6cbd;
      font-size: 8.5pt;
      font-family: "JetBrains Mono", "Fira Code", "Cascadia Code",
                   "Courier New", Courier, monospace;
      padding: 0.1em 0.35em;
      border-radius: 3px;
      border: 1px solid var(--pdf-border-code);
    }

    /* ── Blocchi codice ──────────────────────────────────────────────────── */
    .pdf-body pre {
      background: var(--pdf-bg-code);
      border: 1px solid var(--pdf-border-code);
      border-left: 3px solid var(--pdf-accent);
      border-radius: 4px;
      padding: 0.75em 0.875em;
      overflow-x: auto;
      margin: 0.75em 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-body pre code {
      background: transparent;
      color: var(--pdf-text-primary);
      font-size: 8pt;
      padding: 0;
      border: none;
      border-radius: 0;
      font-family: "JetBrains Mono", "Fira Code", "Cascadia Code",
                   "Courier New", Courier, monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* ── Tabelle ──────────────────────────────────────────────────────────── */
    .pdf-body table {
      border-collapse: collapse;
      width: 100%;
      font-size: 9pt;
      margin: 0.75em 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .pdf-body th,
    .pdf-body td {
      border: 1px solid var(--pdf-border);
      padding: 0.35em 0.65em;
      text-align: left;
      vertical-align: top;
    }

    .pdf-body th {
      background: var(--pdf-bg-table-head);
      font-weight: 700;
      color: var(--pdf-text-primary);
      font-size: 8.5pt;
    }

    .pdf-body td {
      color: var(--pdf-text-secondary);
    }

    .pdf-body tr:nth-child(even) td {
      background: #fafafa;
    }

    /* ── Grafici Graphviz ────────────────────────────────────────────────── */
    .pdf-graphviz-wrap {
      margin: 1.25em 0;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
      background: #fafcff;
      border: 1px solid var(--pdf-border);
      border-radius: 6px;
      padding: 1em;
    }

    .pdf-graphviz-wrap svg {
      max-width: 100%;
      height: auto;
      display: inline-block;
    }

    .pdf-graphviz-error {
      margin: 1em 0;
      padding: 0.75em 1em;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
      color: #991b1b;
      font-size: 8.5pt;
    }

    /* ── KaTeX (formule LaTeX) ─────────────────────────────────────────────── */
    /*
     * Non sovrascrivere font-size né display su .katex/.katex-html:
     * KaTeX calibra la propria gerarchia tipografica internamente.
     * Override su display o font-size rompono frazioni/esponenti/integrali.
     */

    /* Colore di base per tutti i simboli matematici */
    .katex, .katex * {
      color: var(--pdf-text-primary);
    }

    /*
     * Wrapper per formule a blocco (emesso da markdownRenderer.js).
     * overflow-x: auto per scroll su schermo; overflow: visible in stampa
     * per mostrare formule larghe senza tagliarle.
     */
    .katex-display-wrap {
      margin: 1em 0;
      text-align: center;
      max-width: 100%;
      overflow-x: auto;
      overflow-y: visible;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Reset margine KaTeX e scroll orizzontale per formule display */
    .katex-display-wrap > .katex-display {
      margin: 0;
      overflow-x: auto;
      overflow-y: visible;
      max-width: 100%;
    }

    /*
     * In stampa: mostra la formula intera anche se supera il margine
     * (preferibile al troncamento che renderebbe la formula illeggibile).
     * La formula può sforare leggermente il margine destro — accettabile.
     */
    @media print {
      .katex-display-wrap {
        overflow: visible;
        /* Leggermente più piccolo in modalità display per adattarsi meglio */
        font-size: 0.92em;
      }
      .katex-display-wrap > .katex-display {
        overflow: visible;
      }
    }

    /* Formule inline: contenitore scorrevole per formule lunghe su schermo */
    .katex-html {
      max-width: 100%;
      overflow-x: auto;
      display: inline-block;
      vertical-align: middle;
    }

    /* Errori LaTeX (sintassi non valida) */
    .katex-error {
      color: #dc2626;
      font-size: 8pt;
      font-family: "Courier New", monospace;
    }

    /* ── Immagini ──────────────────────────────────────────────────────────── */
    .pdf-body img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0.75em auto;
      border-radius: 4px;
      border: 1px solid var(--pdf-border);
      break-inside: avoid;
    }

    /* ── Utility stampa ───────────────────────────────────────────────────── */
    @media print {
      html, body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      h1, h2, h3, h4, h5, h6 {
        break-after: avoid;
        break-before: auto;
      }

      pre, blockquote, table, .pdf-graphviz-wrap, .katex-display {
        break-inside: avoid;
      }

      a[href]::after {
        content: " (" attr(href) ")";
        font-size: 8pt;
        color: var(--pdf-text-muted);
        font-style: italic;
      }
    }
  `;
}

// ─── Builder documento HTML completo ─────────────────────────────────────────

// URL CDN di KaTeX CSS (versione coerente con la dipendenza nel package.json).
// Carica i font vettoriali KaTeX necessari per un rendering corretto delle formule.
const KATEX_CDN_CSS =
  "https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css";

/**
 * Costruisce il documento HTML completo per la stampa.
 * Inizia direttamente con il contenuto Markdown senza intestazione.
 *
 * @param {string} title    - Titolo della nota (usato come <title> del documento)
 * @param {string} bodyHtml - HTML del corpo (markdown renderizzato + SVG Graphviz)
 * @returns {string} Documento HTML completo
 */
function buildHtmlDocument(title, bodyHtml) {
  const safeTitle = title
    ? title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "Nota";

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="${KATEX_CDN_CSS}" />
  <style>${buildPdfCss()}</style>
</head>
<body>
  <div class="pdf-document">
    <main class="pdf-body">
      ${bodyHtml}
    </main>
  </div>

  <script>
    // Attende che KaTeX CSS e i suoi font siano caricati prima di stampare
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  </script>
</body>
</html>`;
}

// ─── Funzione principale di esportazione ─────────────────────────────────────

/**
 * Esporta una nota Markdown come PDF aprendo una finestra di stampa.
 *
 * @param {string} title           - Titolo della nota
 * @param {string} markdownContent - Contenuto della nota in formato Markdown
 * @returns {Promise<void>}
 */
export async function exportNoteToPdf(title, markdownContent) {
  if (!markdownContent || !markdownContent.trim()) {
    throw new Error("Il contenuto della nota è vuoto.");
  }

  // 1. Markdown → HTML (sincrono, usa il renderer esistente)
  const rawHtml = renderMarkdown(markdownContent);

  // 2. Sostituisci i placeholder Graphviz con SVG reali
  const htmlWithGraphviz = await renderGraphvizInHtml(rawHtml);

  // 3. Costruisci il documento HTML completo
  const htmlDocument = buildHtmlDocument(title, htmlWithGraphviz);

  // 4. Stampa via iframe nascosto — nessuna nuova scheda aperta
  //    Il Blob URL viene usato come src dell'iframe.
  //    Il dialogo di stampa si apre nel tab corrente.
  //    Cleanup (rimozione iframe + revoca URL) avviene alla chiusura del dialogo.
  const blob = new Blob([htmlDocument], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  await new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      width: "1px",
      height: "1px",
      border: "none",
      visibility: "hidden",
      pointerEvents: "none",
    });

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
      try {
        document.body.removeChild(iframe);
      } catch {
        /* già rimosso */
      }
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        resolve();
        return;
      }

      // Ascolta la chiusura del dialogo (Stampa o Annulla)
      win.addEventListener("afterprint", cleanup, { once: true });

      // Piccolo ritardo per garantire il caricamento dei font KaTeX dal CDN
      setTimeout(() => {
        try {
          win.print();
        } catch {
          cleanup();
        }
        // Risolvi subito: l'utente vede il dialogo, il bottone torna normale
        resolve();
      }, 500);
    };

    iframe.onerror = () => {
      cleanup();
      resolve();
    };

    document.body.appendChild(iframe);
    iframe.src = blobUrl;
  });
}
