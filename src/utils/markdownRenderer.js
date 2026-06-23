import { marked } from "marked";
import katex from "katex";

// ===== Renderer customizations (via marked.use) =====

marked.use({
  renderer: {
    // 1. Sicurezza: blocca HTML raw per prevenire XSS
    html() {
      return "";
    },

    // 2. Heading con id auto-generato per anchor links (#sezione)
    //    Segue la convenzione GitHub Flavored Markdown per gli slug.
    heading(token) {
      const content = marked.parseInline(token.text, { gfm: true });
      const slug = token.text
        .toLowerCase()
        .replace(/!\[.*?\]\(.*?\)/g, "") // rimuove immagini inline
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // mantiene solo il testo dei link
        .replace(/[*_`~]/g, "") // rimuove marcatori markdown
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      return `<h${token.depth} id="${slug}">${content}</h${token.depth}>\n`;
    },

    // 3. Blocchi ```dot / ```graphviz → placeholder per rendering WASM asincrono
    code(token) {
      const lang = (token.lang || "").trim().toLowerCase();
      if (lang === "dot" || lang === "graphviz") {
        const encoded = encodeURIComponent(token.text.trim());
        // Placeholder vuoto: l'effetto React sostituirà il contenuto
        // con il preview box (NoteBox) o il loading box + SVG (viewer)
        return `<div class="graphviz-placeholder" data-dot="${encoded}"></div>\n`;
      }
      return false; // fallback al renderer default per gli altri linguaggi
    },
  },
});

// ===== KaTeX: supporto LaTeX =====
// $...$ per inline, $$...$$ per display block.

function renderKatex(formula, displayMode) {
  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      output: "html",
    });
  } catch {
    const safe = formula
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return displayMode
      ? `<div class="katex-error">${safe}</div>`
      : `<span class="katex-error">${safe}</span>`;
  }
}

const mathBlockExt = {
  name: "mathBlock",
  level: "block",
  start: (src) => {
    const i = src.indexOf("$$");
    return i === -1 ? undefined : i;
  },
  tokenizer(src) {
    const m = /^\$\$([\s\S]+?)\$\$/.exec(src);
    if (m) return { type: "mathBlock", raw: m[0], formula: m[1].trim() };
  },
  renderer: (token) =>
    `<div class="katex-display-wrap">${renderKatex(token.formula, true)}</div>\n`,
};

const mathInlineExt = {
  name: "mathInline",
  level: "inline",
  start(src) {
    for (let i = 0; i < src.length; i++) {
      if (src[i] === "$" && src[i + 1] !== "$") return i;
    }
    return undefined;
  },
  tokenizer(src) {
    if (src.startsWith("$$")) return undefined;
    const m = /^\$([^$\n]+?)\$/.exec(src);
    if (m) return { type: "mathInline", raw: m[0], formula: m[1].trim() };
  },
  renderer: (token) => renderKatex(token.formula, false),
};

marked.use({ extensions: [mathBlockExt, mathInlineExt] });

/**
 * Converte Markdown in HTML sicuro. Supporta:
 * - LaTeX: $formula$ (inline) e $$formula$$ (display block) via KaTeX
 * - Grafici Graphviz: blocchi ```dot / ```graphviz → placeholder per MarkdownRenderer
 * - Anchor links: heading con id auto-generati (convenzione GFM)
 *
 * @param {string} markdown
 * @returns {string} HTML pronto per dangerouslySetInnerHTML
 */
const renderMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== "string" || !markdown.trim()) return "";
  try {
    return marked.parse(markdown, { gfm: true, breaks: true });
  } catch {
    return "";
  }
};

export default renderMarkdown;
