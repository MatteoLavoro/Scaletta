import { marked, Renderer } from "marked";
import katex from "katex";

// Renderer personalizzato: sopprime l'HTML grezzo per sicurezza (XSS prevention).
// Solo sintassi Markdown standard viene convertita in HTML.
const safeRenderer = new Renderer();
safeRenderer.html = () => "";

// ===== KaTeX Extension personalizzata =====
// Implementazione custom (senza marked-katex-extension) per avere pieno controllo
// sulla regex di match. marked-katex-extension usa un lookahead restrittivo
// (?=[\s?!.,:]|$) che blocca casi come ($Y$) dove la formula è seguita da ")".

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

// Blocco display: $$...$$ (supporta formule su più righe)
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

// Inline: $...$ senza lookahead restrittivo — funziona in ($Y$), [$x$], ecc.
const mathInlineExt = {
  name: "mathInline",
  level: "inline",
  start(src) {
    // Cerca il primo $ che non faccia parte di $$ (lasciato al blocco)
    for (let i = 0; i < src.length; i++) {
      if (src[i] === "$" && src[i + 1] !== "$") return i;
    }
    return undefined;
  },
  tokenizer(src) {
    if (src.startsWith("$$")) return undefined; // gestito dal blocco
    // Matcha $...$ dove il contenuto non contiene $ né newline
    const m = /^\$([^$\n]+?)\$/.exec(src);
    if (m) return { type: "mathInline", raw: m[0], formula: m[1].trim() };
  },
  renderer: (token) => renderKatex(token.formula, false),
};

marked.use({ extensions: [mathBlockExt, mathInlineExt] });

/**
 * Converte testo Markdown in HTML sicuro (senza raw-HTML pass-through).
 * Supporta LaTeX standard: $formula$ per inline, $$formula$$ per display block.
 * Funziona anche in contesti come ($Y$), [$x$], ecc.
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
