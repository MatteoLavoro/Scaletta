/**
 * pdfExport.js — Servizio di esportazione PDF per note Markdown
 *
 * Flusso:
 *  1. Renderizza il Markdown in HTML (già disponibile via markdownRenderer)
 *  2. Pre-renderizza tutti i grafici Graphviz DOT → SVG (via @viz-js/viz WASM)
 *     e post-processa gli SVG per il tema chiaro (colori fissi, non CSS var)
 *  3. Gestisce le emoji: le emoji nel testo vengono rasterizzate inline come
 *     immagini data-URI (il Chromium headless della Cloud Function non ha font
 *     emoji e i webfont COLRv1 non vengono incorporati nei PDF)
 *  4. Costruisce un documento HTML completo e autocontenuto con CSS light-theme
 *  5. Invia il documento alla Cloud Function generatePdf e scarica il PDF
 *
 * Vantaggi di questo approccio vs. librerie esterne (jsPDF, html2canvas…):
 *  - Testo realmente selezionabile nel PDF (rendering nativo del browser)
 *  - SVG vettoriali perfetti per i grafici Graphviz
 *  - Stili CSS completi: tabelle, codice, formule KaTeX, list ecc.
 *  - Nessuna dipendenza aggiuntiva (usa @viz-js/viz già presente nel progetto)
 *  - Compatibile con tutte le piattaforme (Chrome, Firefox, Safari, Edge)
 */

import { getAuth } from "firebase/auth";
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

// ─── Cache modulo mermaid ─────────────────────────────────────────────────────
let mermaidModulePromise = null;
let mermaidPdfRenderCounter = 0;

function getMermaidModule() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid")
      .then((mod) => mod.default)
      .catch((err) => {
        mermaidModulePromise = null;
        throw err;
      });
  }
  return mermaidModulePromise;
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

// ─── Font emoji per il PDF ────────────────────────────────────────────────────
//
// Il PDF è generato da un Chromium headless (@sparticuz/chromium) che NON
// include i font di sistema, quindi nemmeno un font emoji: senza una gestione
// dedicata le emoji non hanno glifo e non compaiono nel PDF esportato.
// La strategia è descritta nella sezione "Supporto emoji": le emoji nel testo
// vengono rasterizzate inline come immagini data URI, mentre quelle dentro il
// testo SVG dei diagrammi sono coperte dal webfont puntato da EMOJI_FONT_URL.

// Famiglia emoji, SEMPRE accodata ai font stack del documento PDF. La posizione
// in coda è voluta: ogni altro font ha priorità, quindi il testo normale resta
// identico e la famiglia emoji interviene solo sui caratteri senza glifo.
const PDF_EMOJI_FONT_STACK =
  '"Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", "Noto Emoji"';

// URL del webfont emoji dichiarato nel documento PDF tramite @font-face.
// Nota tecnica (verificata con test locale di page.pdf):
//  - Chromium incorpora nel PDF i glifi emoji SOLO per i font a bitmap CBDT.
//    Con un webfont COLRv1 (es. @fontsource/noto-color-emoji o Noto Color Emoji
//    di Google Fonts) i glifi risultano VUOTI nel PDF generato.
//  - v2.038 è l'ultima release di Noto Color Emoji in formato CBDT (Unicode 14).
//
// Questo webfont serve solo per le emoji che non possono essere convertite in
// immagini, cioè quelle dentro il testo SVG dei diagrammi (Graphviz/Mermaid):
// le emoji nel testo normale vengono rasterizzate da emojisToInlineImagesHtml.
// È dichiarato sempre ma viene scaricato da Chromium solo quando una emoji ha
// davvero bisogno del glifo, quindi non ha alcun costo nelle note senza emoji
// in grafi.
const EMOJI_FONT_URL =
  "https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@v2.038/fonts/NotoColorEmoji.ttf";

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

  // 2. Font di sistema per tutti i testi (+ emoji in coda, così anche le
  //    eventuali emoji nelle etichette dei grafi hanno un glifo nel PDF)
  svgElement.querySelectorAll("text, tspan").forEach((el) => {
    el.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, " +
      `${PDF_EMOJI_FONT_STACK}, sans-serif`;
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

      // ── Scaling grafi ────────────────────────────────────────────────────────
      //
      // Obiettivo: il testo nei nodi deve essere circa uguale al corpo del
      // documento PDF (~10pt). I grafi non devono occupare più di ~55% della
      // pagina in altezza.
      //
      // Due fattori di scala vengono calcolati; vince il più restrittivo:
      //
      // 1) FONT-SIZE — riduce se testo > TARGET_MAX_FONT (11pt).
      //    Copre sia font custom (es. fontsize=24) sia il default Graphviz
      //    (14pt), che è il 40% più grande del corpo documento.
      //
      // 2) DIMENSIONI — limita larghezza (PDF_MAX_W) e altezza (PDF_MAX_H).
      //    Applicato a TUTTI i grafi, non solo a quelli portrait.
      //
      // BUG STORICO CORRETTO: la larghezza viene SEMPRE impostata esplicitamente.
      // Senza style.width, un SVG senza attributi width/height si espande al 100%
      // del container → per grafi stretti e alti l'altezza si moltiplica
      // drasticamente, causando grafici che occupano 5-6 pagine inutilmente.

      const TARGET_MAX_FONT = 11; // pt, dimensione testo corpo PDF (base 10pt)
      const PDF_MAX_W = 450; // pt, ~96% larghezza utile A4 (~470pt)
      const PDF_MAX_H = 400; // pt, ~55% altezza utile A4 (~723pt)
      const MIN_GRAPH_W = 50; // pt, larghezza minima leggibile

      // Dimensioni native (Graphviz emette "NNpt", es. "200pt")
      const rawW = svgEl.getAttribute("width") || "";
      const rawH = svgEl.getAttribute("height") || "";
      const naturalW = parseFloat(rawW); // es. "200pt" → 200; 0 se assente
      const naturalH = parseFloat(rawH);

      // Font-size massimo tra tutti i <text> del grafo
      // Graphviz emette font-size come attributo su ogni elemento testo
      let maxFontSize = 0;
      svgEl.querySelectorAll("text").forEach((el) => {
        const fs = parseFloat(el.getAttribute("font-size") || "0");
        if (fs > maxFontSize) maxFontSize = fs;
      });
      // Se nessun testo ha font-size esplicito, assume default Graphviz (14pt)
      if (maxFontSize <= 0) maxFontSize = 14;

      // Scala 1 — font-size: porta il testo a TARGET_MAX_FONT
      // Include il caso default 14pt → 11/14 ≈ 0.786
      const fontScale =
        maxFontSize > TARGET_MAX_FONT ? TARGET_MAX_FONT / maxFontSize : 1;

      // Scala 2 — dimensioni: applica a TUTTI i grafi (non solo portrait)
      let dimScale = 1;
      if (naturalW > 0 && naturalH > 0) {
        const scaleByW = naturalW > PDF_MAX_W ? PDF_MAX_W / naturalW : 1;
        const scaleByH = naturalH > PDF_MAX_H ? PDF_MAX_H / naturalH : 1;
        dimScale = Math.min(scaleByW, scaleByH);
      }

      // Scala finale: il vincolo più restrittivo vince
      const scale = Math.min(fontScale, dimScale);

      // Applica tema chiaro per PDF (colori fissi, bordi visibili su carta)
      applyPdfThemeToSVG(svgEl);

      // Rimuovi attributi nativi
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");

      // FONDAMENTALE: imposta SEMPRE la larghezza esplicita sull'SVG.
      // Se non c'è width esplicita, l'SVG usa il 100% del container → per
      // grafi stretti e alti, l'altezza risultante può essere enorme.
      // MIN_GRAPH_W garantisce una larghezza minima leggibile; l'altezza
      // viene poi calcolata automaticamente dal viewBox (height: auto).
      let finalW;
      if (naturalW > 0) {
        finalW = `${Math.min(Math.max(Math.round(naturalW * scale), MIN_GRAPH_W), PDF_MAX_W)}pt`;
      } else {
        finalW = "100%"; // fallback: nessuna dimensione nota
      }

      svgEl.style.width = finalW;
      svgEl.style.maxWidth = "100%"; // non supera mai il container
      svgEl.style.height = "auto"; // aspect ratio dal viewBox
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

/**
 * Renderizza tutti i placeholder Mermaid nell'HTML in SVG reali.
 * Restituisce l'HTML con i placeholder sostituiti dagli SVG inline.
 *
 * @param {string} html - HTML con elementi mermaid-placeholder
 * @returns {Promise<string>} HTML con SVG inline al posto dei placeholder
 */
async function renderMermaidInHtml(html) {
  const tmpDiv = document.createElement("div");
  tmpDiv.innerHTML = html;

  const placeholders = tmpDiv.querySelectorAll(".mermaid-placeholder");
  if (placeholders.length === 0) return html;

  const mermaid = await getMermaidModule();

  mermaid.initialize({
    startOnLoad: false,
    theme: "default", // sempre tema chiaro per il PDF
    securityLevel: "strict",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, " +
      `${PDF_EMOJI_FONT_STACK}, sans-serif`,
  });

  for (const placeholder of placeholders) {
    const encoded = placeholder.getAttribute("data-mermaid");
    if (!encoded) continue;

    let code;
    try {
      code = decodeURIComponent(encoded);
    } catch {
      continue;
    }

    try {
      const id = `pdf-mermaid-${++mermaidPdfRenderCounter}`;
      const { svg } = await mermaid.render(id, code);

      const wrapper = document.createElement("div");
      wrapper.className = "pdf-mermaid-wrap";
      wrapper.innerHTML = svg;

      const svgEl = wrapper.querySelector("svg");
      if (svgEl) {
        // Mermaid v11 mette width/height="100%" e le dimensioni reali in:
        //   1. viewBox="minX minY W H"  (fonte primaria)
        //   2. style="max-width: XXpx"  (fonte secondaria)
        // Stessa logica di Graphviz: scala per rispettare i limiti PDF e
        // imposta SEMPRE width esplicita per evitare che SVG stretti/alti
        // esplodano in altezza occupando più pagine.
        const PDF_MAX_W = 450; // pt — stessa costante di Graphviz
        const PDF_MAX_H = 400; // pt
        const MIN_W = 50; // pt
        const PX_TO_PT = 0.75; // 1px = 0.75pt a 96dpi

        // Fonte 1: viewBox (più affidabile per Mermaid v10/v11)
        let rawWpx = 0;
        let rawHpx = 0;
        const viewBox = svgEl.getAttribute("viewBox");
        if (viewBox) {
          const vb = viewBox.trim().split(/[\s,]+/);
          if (vb.length >= 4) {
            rawWpx = parseFloat(vb[2]);
            rawHpx = parseFloat(vb[3]);
          }
        }
        // Fonte 2: style="max-width: XXpx" (solo per larghezza se viewBox manca)
        if (!(rawWpx > 0)) {
          const mw = svgEl.style.maxWidth;
          if (mw && mw.endsWith("px")) rawWpx = parseFloat(mw);
        }

        // Rimuovi tutti i vincoli dimensionali di Mermaid
        svgEl.removeAttribute("width");
        svgEl.removeAttribute("height");
        svgEl.style.removeProperty("max-width");
        svgEl.style.height = "auto";
        svgEl.style.maxWidth = "100%";
        svgEl.style.display = "inline-block";

        if (rawWpx > 0 && rawHpx > 0) {
          const naturalW = rawWpx * PX_TO_PT;
          const naturalH = rawHpx * PX_TO_PT;
          const scaleByW = naturalW > PDF_MAX_W ? PDF_MAX_W / naturalW : 1;
          const scaleByH = naturalH > PDF_MAX_H ? PDF_MAX_H / naturalH : 1;
          const scale = Math.min(scaleByW, scaleByH);
          const finalW = Math.min(
            Math.max(Math.round(naturalW * scale), MIN_W),
            PDF_MAX_W,
          );
          svgEl.style.width = `${finalW}pt`;
        } else {
          // Fallback sicuro: cappato a larghezza massima, non 100%
          svgEl.style.width = `${PDF_MAX_W}pt`;
        }
      }

      placeholder.replaceWith(wrapper);
    } catch (err) {
      const errBox = document.createElement("div");
      errBox.className = "pdf-graphviz-error";
      errBox.textContent = `⚠ Impossibile renderizzare il diagramma Mermaid: ${err?.message || "errore sconosciuto"}`;
      placeholder.replaceWith(errBox);
    }
  }

  return tmpDiv.innerHTML;
}

// ─── Supporto emoji ───────────────────────────────────────────────────────────
//
// Le emoji sono normali caratteri Unicode: marked le lascia intatte e arrivano
// nell'HTML così come sono state scritte nella nota. Il PDF però è generato da
// un Chromium headless privo di font emoji e, come verificato con test locali di
// page.pdf, i glifi emoji dei webfont COLRv1 non vengono incorporati (restano
// vuoti). Strategia adottata:
//  1. emoji nel testo normale (paragrafi, titoli, liste, tabelle, codice):
//     rasterizzate inline come <img> data URI → sempre renderizzate, qualunque
//     PDF viewer e qualunque emoji (anche le più recenti)
//  2. emoji dentro il testo SVG dei diagrammi (dove un <img> HTML non
//     renderizza): coperte dal webfont CBDT dichiarato in buildPdfCss()
// Maggiori dettagli nelle funzioni emojisToInlineImagesHtml e buildPdfCss.

// Regex di riconoscimento emoji. Si preferisce la proprietà RGI (sequenze emoji
// complete, richiede il flag "v"); se il browser non la supporta si ripiega su
// Extended_Pictographic + bandiere + keycap.
let EMOJI_TEST_RE = null;
try {
  EMOJI_TEST_RE = new RegExp("\\p{RGI_Emoji}", "v");
} catch {
  try {
    EMOJI_TEST_RE =
      /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]|[\d#*]\uFE0F?\u20E3/u;
  } catch {
    EMOJI_TEST_RE = null;
  }
}

// Segmentazione in grapheme cluster: serve per non spezzare sequenze come
// 👨‍👩‍👧‍👦 (ZWJ), 🏳️‍🌈, le bandiere 🇮🇹 o le emoji con tono pelle 👍🏽.
const emojiGraphemeSegmenter =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("it", { granularity: "grapheme" })
    : null;

function splitGraphemes(text) {
  if (emojiGraphemeSegmenter) {
    return Array.from(emojiGraphemeSegmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

function isEmojiGrapheme(grapheme) {
  if (!grapheme || !EMOJI_TEST_RE) return false;
  return EMOJI_TEST_RE.test(grapheme);
}

/**
 * Verifica se un testo contiene almeno una emoji.
 * @param {string} text
 * @returns {boolean}
 */
function containsEmoji(text) {
  if (!text || !EMOJI_TEST_RE) return false;
  return EMOJI_TEST_RE.test(text);
}

// Cache delle emoji già rasterizzate (grapheme → data URI oppure null)
const emojiImageCache = new Map();

/**
 * Rasterizza una emoji in una data URI PNG usando i font emoji del dispositivo.
 * @param {string} emoji - Grapheme cluster emoji
 * @returns {string|null} Data URI PNG, oppure null se non rasterizzabile
 */
function emojiToPngDataUri(emoji) {
  if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji);

  let dataUri = null;
  try {
    const BOX = 96; // altezza canvas in px (→ ~400 dpi per una emoji a 10pt)
    const FONT_SIZE = 72;
    const fontStack =
      `${FONT_SIZE}px "Apple Color Emoji", "Segoe UI Emoji", ` +
      `"Noto Color Emoji", "Android Emoji", "Noto Emoji", sans-serif`;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.font = fontStack;
      const metrics = ctx.measureText(emoji);

      // Larghezza reale dell'inchiostro: gestisce anche le sequenze larghe
      // (ZWJ, bandiere) che superano la larghezza dell'em quad.
      const inkWidth = Math.ceil(
        (metrics.actualBoundingBoxLeft || 0) +
          (metrics.actualBoundingBoxRight || metrics.width || FONT_SIZE),
      );
      const PAD = 6;

      canvas.width = Math.min(inkWidth + PAD * 2, 1024);
      canvas.height = BOX;

      // Il resize del canvas azzera lo stato del contesto: va riconfigurato
      ctx.font = fontStack;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, canvas.width / 2, BOX / 2);

      dataUri = canvas.toDataURL("image/png");
    }
  } catch {
    dataUri = null; // in caso di errore l'emoji resta testo (come prima)
  }

  emojiImageCache.set(emoji, dataUri);
  return dataUri;
}

/**
 * Sostituisce le emoji nei nodi di testo dell'HTML con <img> inline in data URI.
 * Le immagini sono incorporate nell'HTML, quindi la Cloud Function le
 * renderizza senza bisogno di alcun font emoji installato e il risultato è
 * identico in qualsiasi PDF viewer.
 *
 * Vengono toccati solo i nodi di testo (mai tag o attributi). Sono esclusi
 * unicamente i testi in namespace SVG (es. <text> di Graphviz/Mermaid), dove un
 * <img> HTML non verrebbe renderizzato: per quelli resta il webfont CBDT.
 * I testi HTML dentro <foreignObject> (label dei diagrammi Mermaid) vengono
 * invece convertiti, perché sono normali elementi HTML.
 *
 * @param {string} html - HTML del corpo del documento
 * @returns {string} HTML con le emoji sostituite da immagini inline
 */
function emojisToInlineImagesHtml(html) {
  if (!EMOJI_TEST_RE) return html;

  const SVG_NS = "http://www.w3.org/2000/svg";
  const tmpDiv = document.createElement("div");
  tmpDiv.innerHTML = html;

  const walker = document.createTreeWalker(tmpDiv, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    const text = node.nodeValue || "";
    if (!text || !EMOJI_TEST_RE.test(text)) return;
    if (node.parentElement?.namespaceURI === SVG_NS) return;

    const fragment = document.createDocumentFragment();
    let replaced = false;

    for (const grapheme of splitGraphemes(text)) {
      const dataUri = isEmojiGrapheme(grapheme)
        ? emojiToPngDataUri(grapheme)
        : null;

      if (dataUri) {
        const img = document.createElement("img");
        img.className = "pdf-emoji";
        img.src = dataUri;
        img.alt = grapheme;
        fragment.appendChild(img);
        replaced = true;
      } else {
        fragment.appendChild(document.createTextNode(grapheme));
      }
    }

    if (replaced && node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  });

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

    /*
     * Webfont emoji (CBDT). Chromium lo scarica solo se nel documento serve un
     * glifo emoji che non è già stato sostituito da un'immagine inline, cioè
     * per le emoji dentro il testo SVG dei grafi.
     */
    @font-face {
      font-family: "Noto Color Emoji";
      src: url(${EMOJI_FONT_URL}) format("truetype");
      font-display: swap;
    }

    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter",
                   Roboto, Oxygen, Ubuntu, "Helvetica Neue", Arial,
                   ${PDF_EMOJI_FONT_STACK}, sans-serif;
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
                   "Courier New", Courier, ${PDF_EMOJI_FONT_STACK}, monospace;
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
                   "Courier New", Courier, ${PDF_EMOJI_FONT_STACK}, monospace;
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

    /* ── Diagrammi Mermaid ─────────────────────────────────────────────────── */
    .pdf-mermaid-wrap {
      margin: 1.25em 0;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
      background: #fafcff;
      border: 1px solid var(--pdf-border);
      border-radius: 6px;
      padding: 1em;
    }

    .pdf-mermaid-wrap svg {
      max-width: 100%;
      height: auto;
      display: inline-block;
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

    /*
     * Emoji rasterizzate inline come immagini data URI (vedi
     * emojisToInlineImagesHtml). Sovrascrive la regola .pdf-body img: immagine
     * inline, senza bordo/margini, allineata al testo.
     */
    .pdf-body img.pdf-emoji {
      display: inline;
      height: 1.15em;
      width: auto;
      max-width: none;
      margin: 0 0.04em;
      padding: 0;
      border: none;
      border-radius: 0;
      vertical-align: -0.15em;
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
 * @param {string} bodyHtml - HTML del corpo (markdown + SVG Graphviz/Mermaid)
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
  <main class="pdf-body">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

// ─── Funzione principale di esportazione ─────────────────────────────────────

// URL della Cloud Function generatePdf (progetto Firebase: scaletta-1).
const GENERATE_PDF_URL = "https://generatepdf-3ujl6wiqia-uc.a.run.app";

/**
 * Esporta una nota Markdown come PDF tramite Cloud Function server-side.
 *
 * Flusso:
 *  1. Ottiene il token Firebase Auth dell'utente corrente
 *  2. Renderizza Markdown -> HTML + SVG Graphviz/Mermaid (client-side)
 *  3. Gestisce le emoji: le emoji nel testo sono rasterizzate inline come
 *     immagini data-URI (unico formato che Chromium incorpora sempre nel PDF),
 *     quelle nei diagrammi sono coperte dal webfont CBDT
 *  4. Invia l'HTML completo alla Cloud Function generatePdf via POST
 *  5. Riceve il PDF binario e lo scarica direttamente (nessun dialogo)
 *
 * @param {string} title           - Titolo della nota
 * @param {string} markdownContent - Contenuto in formato Markdown
 * @returns {Promise<void>}
 */
export async function exportNoteToPdf(title, markdownContent) {
  if (!markdownContent || !markdownContent.trim()) {
    throw new Error("Il contenuto della nota è vuoto.");
  }

  // 1. Token Firebase Auth per autorizzare la Cloud Function
  const auth = getAuth();
  if (!auth.currentUser) {
    throw new Error(
      "Utente non autenticato. Accedi all'app prima di esportare.",
    );
  }
  const token = await auth.currentUser.getIdToken();

  // 2. Costruisci l'HTML completo (Markdown -> HTML + SVG Graphviz + SVG Mermaid inline)
  const rawHtml = renderMarkdown(markdownContent);
  const htmlWithGraphviz = await renderGraphvizInHtml(rawHtml);
  const htmlWithDiagrams = await renderMermaidInHtml(htmlWithGraphviz);

  // 2b. Emoji: le emoji nel testo vengono rasterizzate inline come immagini
  // data-URI (unico modo perché Chromium le incorpori sempre nel PDF); le
  // eventuali emoji dentro il testo SVG dei grafi restano glifi e sono coperte
  // dal webfont CBDT dichiarato nel CSS del documento.
  const bodyHtml = containsEmoji(markdownContent)
    ? emojisToInlineImagesHtml(htmlWithDiagrams)
    : htmlWithDiagrams;

  const htmlDocument = buildHtmlDocument(title, bodyHtml);

  // 3. Invia alla Cloud Function e ricevi il PDF binario
  let response;
  try {
    response = await fetch(GENERATE_PDF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ html: htmlDocument, title: title || "Nota" }),
    });
  } catch {
    throw new Error(
      "Impossibile contattare il servizio di generazione PDF. " +
        "Controlla la connessione e riprova.",
    );
  }

  if (!response.ok) {
    let errMsg = `Errore server ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errData.message || errMsg;
    } catch {
      /* ignore */
    }
    throw new Error(`Generazione PDF non riuscita: ${errMsg}`);
  }

  // 4. Download diretto del PDF (nessun dialogo di stampa)
  const pdfBlob = await response.blob();
  const downloadUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download =
    ((title || "nota").replace(/[^\w\u00C0-\u024F\s-]/g, "").trim() || "nota") +
    ".pdf";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
}
