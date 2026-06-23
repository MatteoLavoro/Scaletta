import { useMemo, useEffect, useRef } from "react";
import renderMarkdown from "../../utils/markdownRenderer";

// Singleton per l'istanza Viz — lazy-loaded la prima volta che serve,
// poi riutilizzata per tutte le render successive.
let vizPromise = null;

// Mappa per tenere traccia degli interval dei puntini animati (el → intervalId)
const dotTimers = new Map();

function getViz() {
  if (!vizPromise) {
    console.log(
      "[Graphviz] 📦 Prima richiesta — avvio caricamento modulo WASM...",
      new Date().toISOString(),
    );
    vizPromise = import("@viz-js/viz")
      .then((mod) => {
        console.log(
          "[Graphviz] 🔧 Modulo JS caricato, inizializzazione istanza Graphviz...",
          new Date().toISOString(),
        );
        return mod.instance();
      })
      .then((viz) => {
        console.log(
          "[Graphviz] ✅ Motore Graphviz pronto e in cache",
          new Date().toISOString(),
        );
        return viz;
      })
      .catch((err) => {
        // Reset promise in modo da riprovare al prossimo mount
        vizPromise = null;
        console.error(
          "[Graphviz] 💥 Errore inizializzazione motore WASM:",
          err,
          new Date().toISOString(),
        );
        throw err;
      });
  } else {
    console.log("[Graphviz] ♻️  Riutilizzo motore Graphviz già in cache");
  }
  return vizPromise;
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

// Icona grafo inline SVG (usata nei placeholder preview)
const GRAPH_ICON_HTML =
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" ` +
  `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>` +
  `<line x1="8.59" y1="13.51" x2="15.42" y2="6.49"/><line x1="8.59" y1="10.49" x2="15.42" y2="17.51"/>` +
  `</svg>`;

/**
 * MarkdownRenderer — component React per contenuto Markdown.
 *
 * @param {string}   content                  - Testo Markdown da renderizzare
 * @param {string}   [className]              - Classi CSS aggiuntive sul wrapper
 * @param {object}   [style]                  - Style inline aggiuntivo sul wrapper
 * @param {boolean}  [enableAnchorLinks=false] - Abilita scroll su click #link
 * @param {boolean}  [renderGraphviz=false]   - Se true renderizza i grafi DOT via WASM;
 *                                              se false mostra un placeholder statico
 */
const MarkdownRenderer = ({
  content,
  className,
  style,
  enableAnchorLinks = false,
  renderGraphviz = false,
}) => {
  const containerRef = useRef(null);
  const html = useMemo(() => renderMarkdown(content || ""), [content]);

  // ── Graphviz ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const placeholders = /** @type {NodeListOf<HTMLElement>} */ (
      container.querySelectorAll(".graphviz-placeholder")
    );
    if (placeholders.length === 0) return;

    const total = placeholders.length;

    if (!renderGraphviz) {
      // ── Preview mode: box statico, nessun WASM ──
      console.log(
        `[Graphviz] 👁️  Modalità anteprima — ${total} grafico/i (solo placeholder, nessun WASM)`,
      );
      placeholders.forEach((el) => {
        el.className = "graphviz-placeholder graphviz-preview-mode";
        el.innerHTML =
          `<div class="graphviz-preview-box">` +
          `<div class="graphviz-preview-icon">${GRAPH_ICON_HTML}</div>` +
          `<div class="graphviz-preview-body">` +
          `<span class="graphviz-preview-title">Grafico</span>` +
          `<span class="graphviz-preview-sub">Visualizzabile aprendo la nota in modalità visualizzazione</span>` +
          `</div>` +
          `</div>`;
      });
      return;
    }

    // ── Viewer mode: loading box → SVG ──
    console.log(
      `[Graphviz] 🔄 Avvio rendering — ${total} grafo/i trovato/i`,
      new Date().toISOString(),
    );

    placeholders.forEach((el, i) => {
      if (el.classList.contains("graphviz-rendered")) return;
      const label = total > 1 ? `Grafico ${i + 1} di ${total}` : "Grafico";
      el.innerHTML =
        `<div class="graphviz-loading-box">` +
        `<div class="graphviz-loading-icon">${GRAPH_ICON_HTML}</div>` +
        `<div class="graphviz-loading-text">` +
        `Caricamento ${label}<span class="graphviz-dots"></span>` +
        `</div>` +
        `</div>`;
      // Avvia animazione puntini via JS (compatibile con tutti i browser)
      const dotsEl = el.querySelector(".graphviz-dots");
      const timerId = startDotsAnimation(dotsEl);
      if (timerId !== undefined) dotTimers.set(el, timerId);
      console.log(
        `[Graphviz] ⏳ Loading box mostrato per grafico ${i + 1}/${total} — elemento in DOM: ${el.isConnected}`,
      );
    });

    let cancelled = false;

    getViz()
      .then((viz) => {
        // FIX per React 18 StrictMode: NON usare la `placeholders` NodeList dalla
        // closure — React StrictMode stacca i nodi DOM prima che la Promise si risolva,
        // anche se il cleanup non è ancora stato invocato (cancelled=false).
        // Soluzione: ri-query containerRef.current al momento della risoluzione,
        // che punta sempre al container del mount finale (live).
        const liveContainer = containerRef.current;
        if (!liveContainer) {
          console.log(
            "[Graphviz] ⚠️ Contenitore non nel DOM — componente smontato, skip",
          );
          return;
        }

        const toRender = /** @type {NodeListOf<HTMLElement>} */ (
          liveContainer.querySelectorAll(
            ".graphviz-placeholder:not(.graphviz-rendered):not(.graphviz-preview-mode)",
          )
        );
        const count = toRender.length;

        if (count === 0) {
          console.log(
            "[Graphviz] ✅ Nessun grafico da renderizzare (già pronti o assenti)",
          );
          return;
        }

        console.log(
          `[Graphviz] 🎨 Motore pronto — rendering ${count} grafico/i su container live`,
          new Date().toISOString(),
        );

        toRender.forEach((el, i) => {
          // Se il DOM è stato ricreato da StrictMode il loading box potrebbe mancare
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
          if (!dot) {
            console.warn(
              `[Graphviz] ⚠️ Grafico ${i + 1}/${count} — data-dot vuoto, salto`,
            );
            return;
          }
          console.log(
            `[Graphviz] 🖼 Rendering grafico ${i + 1}/${count} — DOT: ${dot.length} chars — in DOM: ${el.isConnected}`,
          );

          try {
            // Usa renderSVGElement (invece di renderString + innerHTML) per ottenere
            // direttamente un SVGElement nel namespace corretto, evitando problemi
            // di parsing HTML che trasformano il contenuto SVG in testo.
            const svgElement = viz.renderSVGElement(dot);

            // Fix dimensioni responsive prima dell'inserimento
            svgElement.setAttribute("width", "100%");
            svgElement.removeAttribute("height");

            stopDotsAnimation(el);
            el.innerHTML = ""; // rimuove loading box
            el.appendChild(svgElement);
            el.classList.add("graphviz-rendered");

            console.log(
              `[Graphviz] ✅ Grafico ${i + 1}/${count} — SVGElement inserito — viewBox: ${svgElement.getAttribute("viewBox")} — in DOM: ${el.isConnected}`,
              new Date().toISOString(),
            );
            requestAnimationFrame(() => {
              const rect = el.getBoundingClientRect();
              console.log(
                `[Graphviz] 📐 Grafico ${i + 1}/${count} — ${Math.round(rect.width)}×${Math.round(rect.height)}px — visibile: ${rect.width > 0 && rect.height > 0}`,
              );
            });
          } catch (err) {
            console.error(
              `[Graphviz] ❌ Grafico ${i + 1}/${count} — errore rendering:`,
              err,
            );
            console.error(`[Graphviz]    DOT sorgente:\n${dot}`);
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
        console.error(
          "[Graphviz] ❌ Impossibile caricare il motore WASM:",
          err,
          new Date().toISOString(),
        );
        console.error("[Graphviz]    Stack:", err?.stack ?? err);
        const liveContainer = containerRef.current;
        if (!liveContainer) return;
        const msg = String(err?.message ?? err)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        liveContainer
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
      console.log("[Graphviz] 🧹 Cleanup effect");
    };
  }, [html, renderGraphviz]);

  // ── Anchor links ─────────────────────────────────────────────────────────────
  const handleClick = enableAnchorLinks
    ? (e) => {
        const anchor = e.target.closest("a");
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href?.startsWith("#")) return;
        e.preventDefault();
        const target = containerRef.current?.querySelector(
          `[id="${CSS.escape(href.slice(1))}"]`,
        );
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handleClick}
    />
  );
};

export default MarkdownRenderer;
