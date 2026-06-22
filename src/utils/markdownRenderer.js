import { marked, Renderer } from "marked";
import markedKatex from "marked-katex-extension";

// Renderer personalizzato: sopprime l'HTML grezzo per sicurezza (XSS prevention).
// Solo sintassi Markdown standard viene convertita in HTML.
// Nota: il renderer KaTeX genera HTML tramite il sistema di estensioni di marked,
// non attraverso i token html raw, quindi non viene soppresso da questa regola.
const safeRenderer = new Renderer();
safeRenderer.html = () => "";

// Abilita il supporto LaTeX: $...$ per inline, $$...$$ per display block.
// throwOnError: false mostra l'espressione originale in caso di errore di sintassi.
marked.use(markedKatex({ throwOnError: false, output: "html" }));

/**
 * Converte testo Markdown in HTML sicuro (senza raw-HTML pass-through).
 * Supporta LaTeX standard: $formula$ per inline, $$formula$$ per display block.
 * @param {string} markdown - Testo in formato Markdown
 * @returns {string} - HTML risultante pronto per dangerouslySetInnerHTML
 */
const renderMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== "string" || !markdown.trim()) return "";
  try {
    return marked.parse(markdown, {
      renderer: safeRenderer,
      gfm: true,
      breaks: true,
    });
  } catch {
    return "";
  }
};

export default renderMarkdown;
