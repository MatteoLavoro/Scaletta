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

    // 3. Blocchi ```dot / ```graphviz / ```mermaid → placeholder per rendering asincrono
    code(token) {
      const lang = (token.lang || "").trim().toLowerCase();
      if (lang === "dot" || lang === "graphviz") {
        const encoded = encodeURIComponent(token.text.trim());
        // Placeholder vuoto: l'effetto React sostituirà il contenuto
        // con il preview box (NoteBox) o il loading box + SVG (viewer)
        return `<div class="graphviz-placeholder" data-dot="${encoded}"></div>\n`;
      }
      if (lang === "mermaid") {
        const encoded = encodeURIComponent(token.text.trim());
        return `<div class="mermaid-placeholder" data-mermaid="${encoded}"></div>\n`;
      }
      return false; // fallback al renderer default per gli altri linguaggi
    },
  },
});

// ===== KaTeX: supporto LaTeX =====
// $...$ per inline, $$...$$ per display block.

// Mappa caratteri Unicode "matematici" → comandi LaTeX equivalenti.
// Evita i warning di KaTeX (unknownSymbol / "No character metrics") quando
// nelle formule compaiono simboli Unicode greci o operatori incollati da testo,
// e ne garantisce il rendering corretto.
const UNICODE_MATH_MAP = {
  // Greco minuscolo
  "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta",
  "ε": "\\varepsilon", "ϵ": "\\epsilon", "ζ": "\\zeta", "η": "\\eta",
  "θ": "\\theta", "ϑ": "\\vartheta", "ι": "\\iota", "κ": "\\kappa",
  "λ": "\\lambda", "μ": "\\mu", "ν": "\\nu", "ξ": "\\xi",
  "π": "\\pi", "ϖ": "\\varpi", "ρ": "\\rho", "ϱ": "\\varrho",
  "σ": "\\sigma", "ς": "\\varsigma", "τ": "\\tau", "υ": "\\upsilon",
  "φ": "\\varphi", "ϕ": "\\phi", "χ": "\\chi", "ψ": "\\psi", "ω": "\\omega",
  // Greco maiuscolo
  "Γ": "\\Gamma", "Δ": "\\Delta", "Θ": "\\Theta", "Λ": "\\Lambda",
  "Ξ": "\\Xi", "Π": "\\Pi", "Σ": "\\Sigma", "Υ": "\\Upsilon",
  "Φ": "\\Phi", "Ψ": "\\Psi", "Ω": "\\Omega",
  // Operatori e simboli comuni
  "×": "\\times", "÷": "\\div", "±": "\\pm", "∓": "\\mp",
  "−": "-", "–": "-", "—": "-",
  "≤": "\\le", "≥": "\\ge", "≠": "\\ne", "≈": "\\approx",
  "≡": "\\equiv", "∞": "\\infty", "∝": "\\propto",
  "→": "\\to", "←": "\\leftarrow", "↔": "\\leftrightarrow",
  "⇒": "\\Rightarrow", "⇐": "\\Leftarrow", "⇔": "\\Leftrightarrow",
  "∈": "\\in", "∉": "\\notin", "⊂": "\\subset", "⊆": "\\subseteq",
  "∪": "\\cup", "∩": "\\cap", "∅": "\\emptyset",
  "∑": "\\sum", "∏": "\\prod", "∫": "\\int",
  "∂": "\\partial", "∇": "\\nabla", "⋅": "\\cdot", "∘": "\\circ",
  "°": "^\\circ", "¹": "^1", "²": "^2", "³": "^3",
  "′": "'", "″": "''", "…": "\\dots", "⋯": "\\cdots",
};

const UNICODE_MATH_RE = new RegExp(
  `[${Object.keys(UNICODE_MATH_MAP).join("")}]`,
  "g",
);

/**
 * Sostituisce i caratteri Unicode matematici con i comandi LaTeX equivalenti.
 * @param {string} str
 * @returns {string}
 */
const normalizeMathUnicode = (str) =>
  str.replace(UNICODE_MATH_RE, (ch) => UNICODE_MATH_MAP[ch] || ch);

function renderKatex(formula, displayMode) {
  try {
    return katex.renderToString(normalizeMathUnicode(formula), {
      displayMode,
      throwOnError: false,
      strict: false,
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
