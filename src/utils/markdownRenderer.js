import { marked, Renderer } from "marked";

// Renderer personalizzato: sopprime l'HTML grezzo per sicurezza (XSS prevention).
// Solo sintassi Markdown standard viene convertita in HTML.
const safeRenderer = new Renderer();
safeRenderer.html = () => "";

/**
 * Converte testo Markdown in HTML sicuro (senza raw-HTML pass-through).
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
