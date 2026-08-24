# 📋 Analisi Approfondita: Modale di Visualizzazione Markdown

## 🎯 Panoramica

Il **MarkdownBox** è un componente specializzato per le note in formato Markdown con un sistema sofisticato di visualizzazione e editing. Il flusso comprende:

1. **Anteprima nel Box** (`MarkdownBox.jsx`)
2. **Visualizzazione Fullscreen** (`NoteViewerModal.jsx` con `SplitModal.jsx`)
3. **Editing Ricco** (`RichTextModal.jsx`)
4. **Rendering** (`MarkdownRenderer.jsx` + `markdownRenderer.js`)

---

## 📦 Architettura Componenti

```
MarkdownBox.jsx
├── Anteprima box (max 320px, 20 righe)
│   └── [Click] → setIsViewerOpen(true)
│
├── NoteViewerModal (isViewerOpen)
│   └── SplitModal (layout a 3 colonne)
│       ├── [Colonna Sx] Indice + Strumenti
│       ├── [Colonna Centro] Markdown Completo
│       └── [Colonna Dx] (gestita da props)
│
└── RichTextModal (isEditNoteOpen)
    ├── Modalità TXT (contentEditable + toolbar)
    └── Modalità Markdown (textarea plain)
```

---

## 🔍 MarkdownBox - Componente Principale

### Props

```javascript
const MarkdownBox = ({
  title = "Markdown",           // Titolo del box
  content = "",                 // Contenuto Markdown completo
  isPinned = false,             // Se il box è fissato
  createdByName = null,         // Autore
  createdAt = null,             // Data creazione
  onPinToggle,                  // Callback pin
  onTitleChange,                // Callback cambio titolo
  onContentChange,              // Callback cambio contenuto
  onDelete,                     // Callback eliminazione
  onSendMessageFromBox,         // Callback chat
})
```

### Meccanica dell'Anteprima

```javascript
// 1. Truncatura Intelligente
const PREVIEW_LINE_LIMIT = 20;      // Max righe renderizzate
const PREVIEW_MAX_HEIGHT = 320;     // Max px altezza

const { previewContent, isTruncated } = useMemo(() => {
  const lines = content.split("\n");
  if (lines.length <= PREVIEW_LINE_LIMIT) {
    return { previewContent: content, isTruncated: false };
  }
  return {
    previewContent: lines.slice(0, PREVIEW_LINE_LIMIT).join("\n"),
    isTruncated: true,
  };
}, [content]);

// 2. Rendering dell'Anteprima
<div style={{ maxHeight: `320px`, overflow: "hidden" }}>
  {/* Se troncato: applica gradiente di fade */}
  {isTruncated && {
    maskImage: "linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)"
  }}
  <MarkdownRenderer content={previewContent} />
</div>

// 3. Click sul Box → Modale Fullscreen
<button onClick={() => setIsViewerOpen(true)}>
  {/* Anteprima */}
</button>
```

### Vantaggi della Truncatura

| Aspetto           | Beneficio                                                 |
| ----------------- | --------------------------------------------------------- |
| **Performance**   | Solo le prime 20 righe vengono passate al parser markdown |
| **Costo Parsing** | Zero costo per documenti lunghi nel box                   |
| **UX**            | Gradiente suggerisce che c'è più contenuto                |
| **Click→Viewer**  | L'utente sa di poter leggere tutto nel modale             |

---

## 🎬 NoteViewerModal - Visualizzatore Fullscreen

Quando `contentType !== "markdown"` → **Modal classico**  
Quando `contentType === "markdown"` → **SplitModal a 3 colonne**

### Layout SplitModal per Markdown

```
┌─────────────────────┬────────────────────────────────────┐
│                     │                                    │
│   [Indice TOC]      │  [Contenuto Markdown]              │
│   (400px)           │  • Scroll indipendente             │
│                     │  • Zoom 50%-250%                   │
│   [Strumenti]       │  • Rendering completo + grafici    │
│   (400px)           │                                    │
│                     │  [Heading attivo                   │
│                     │   evidenziato nel TOC]             │
│                     │                                    │
└─────────────────────┴────────────────────────────────────┘
```

### Funzionalità Chiave

#### 1️⃣ Estrazione Automatica Table of Contents

```javascript
function extractTableOfContents(markdown) {
  // 1. Renderizza markdown → HTML
  const html = renderMarkdown(markdown);
  const doc = new DOMParser().parseFromString(html, "text/html");

  // 2. Estrae TUTTI gli h1-h6 con id (generato automaticamente)
  const allHeadings = Array.from(
    doc.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"),
  ).map(el => ({
    id: el.id,
    text: el.textContent?.trim() || "",
    depth: parseInt(el.tagName[1]),
    hasOnlyInternalLinks: /* verifica se heading è sezione indice */
  }));

  // 3. Filtra sezione indice (primi heading che contengono SOLO link)
  let indexSectionEnd = 0;
  for (let i = 0; i < allHeadings.length; i++) {
    if (allHeadings[i].hasOnlyInternalLinks) {
      indexSectionEnd = i + 1;
    } else break;
  }

  // 4. Ritorna heading dopo l'indice
  return allHeadings.slice(indexSectionEnd).map(({ id, text, depth }) => ({
    slug: id,
    text,
    depth,
  }));
}
```

**Supporta documenti con o senza sezione indice esplicita.**

#### 2️⃣ Pannello TOC Interattivo

```javascript
const TocContent = ({
  headings, // Array heading da renderizzare
  onHeadingClick, // Scroll al click
  activeSlug, // ID heading attualmente visibile
  favorites, // Set di slug preferiti
  onFavoriteToggle, // Toggle preferito
}) => {
  // Scorre il TOC per tenere visibile la voce attiva
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({
      behavior: "instant", // Nessuna animazione se scroller veloce
      block: "nearest",
    });
  }, [activeSlug]);

  return (
    <nav>
      {headings.map((h) => (
        <button
          onClick={() => onHeadingClick(h.slug)} // Scroll contenuto
          className={isActive ? "highlight" : ""}
          style={{ paddingLeft: `${(h.depth - 1) * 10 + 8}px` }}
        >
          <span>{h.text}</span>
          {/* ⭐ Bottone preferito (appears on hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(h.slug);
            }}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </button>
      ))}
    </nav>
  );
};
```

#### 3️⃣ Tracciamento Posizione di Lettura

**Algoritmo (effetto "seguimi TOC"):**

```
Quando l'utente scorre il contenuto centrale:

1. Seleziona il primo heading VISIBILE nel viewport
   ✓ Se visibile → evidenzia QUELLA sezione

2. Se nessuno è visibile → cerca il heading SOPRA al viewport
   ✓ Prendi quello il cui `top` è MASSIMO (più vicino)
   ✓ Questo = "sezione che stai leggendo adesso"

3. Applica highlight nel TOC e scorre il TOC stesso
   ✓ La voce rimane sempre visibile nel pannello sx
```

**Implementazione:**

```javascript
useEffect(() => {
  const handleScroll = () => {
    requestAnimationFrame(() => {
      const viewportTop = scrollEl.getBoundingClientRect().top;
      const viewportBottom = scrollEl.getBoundingClientRect().bottom;

      let firstVisibleHeading = null;
      let mostRecentPassedHeading = null;
      let maxTopPassedHeading = -Infinity;

      for (const heading of headingEls) {
        const headingTop = heading.getBoundingClientRect().top;

        if (headingTop >= viewportTop && headingTop < viewportBottom) {
          firstVisibleHeading = heading;
        }

        if (headingTop < viewportTop && headingTop > maxTopPassedHeading) {
          maxTopPassedHeading = headingTop;
          mostRecentPassedHeading = heading;
        }
      }

      // Priorità: visibile nel viewport > heading più recente
      const activeEl = firstVisibleHeading || mostRecentPassedHeading;
      setActiveSlug(activeEl?.id ?? null);
    });
  };

  scrollEl.addEventListener("scroll", handleScroll, { passive: true });
  return () => scrollEl.removeEventListener("scroll", handleScroll);
}, [isOpen, headings, scale]);
```

#### 4️⃣ Zoom Contenuto (50%-250%)

```javascript
const [scale, setScale] = useState(100);  // % di zoom

// Nel pannello contenuto:
<div style={{ transform: `scale(${scale / 100})`, transformOrigin: "top center" }}>
  <MarkdownRenderer content={content} />
</div>

// Bottoni:
<button onClick={() => setScale(Math.max(50, scale - 25))}>−</button>
<span>{scale}%</span>
<button onClick={() => setScale(Math.min(250, scale + 25))}>+</button>

// scale va nei dependencies del tracking → ricalcola posizioni al cambio zoom
useEffect(() => {
  // Tracciamento posizione lettura riattivato quando scale cambia
}, [isOpen, headings, scale]);  // ← scale → re-run effect
```

---

## ⚙️ Rendering Markdown

### 1. markdownRenderer.js - Parser Base

Usa **marked** con estensioni custom:

```javascript
import { marked } from "marked";
import katex from "katex";

marked.use({
  renderer: {
    // 1. Blocca HTML raw (prevenzione XSS)
    html() {
      return "";
    },

    // 2. Heading con id auto-generato (anchor links)
    heading(token) {
      const slug = token.text
        .toLowerCase()
        .replace(/!\[.*?\]\(.*?\)/g, "") // rimuove immagini
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // estrae testo link
        .replace(/[*_`~]/g, "") // rimuove markdown
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      return `<h${token.depth} id="${slug}">...</h${token.depth}>`;
    },

    // 3. Graphviz / Mermaid → placeholder
    code(token) {
      const lang = (token.lang || "").trim().toLowerCase();
      if (lang === "dot" || lang === "graphviz") {
        const encoded = encodeURIComponent(token.text.trim());
        return `<div class="graphviz-placeholder" data-dot="${encoded}"></div>`;
      }
      if (lang === "mermaid") {
        const encoded = encodeURIComponent(token.text.trim());
        return `<div class="mermaid-placeholder" data-mermaid="${encoded}"></div>`;
      }
      return false; // default per altri linguaggi
    },
  },
});

// === KaTeX per LaTeX ===
// $...$ → inline, $$...$$ → display block
function renderKatex(formula, displayMode) {
  return katex.renderToString(formula, {
    displayMode,
    throwOnError: false,
    output: "html",
  });
}

// Estensioni marked
const mathBlockExt = {
  name: "mathBlock",
  level: "block",
  start: (src) => src.indexOf("$$"),
  tokenizer(src) {
    const m = /^\$\$([\s\S]+?)\$\$/.exec(src);
    if (m) return { type: "mathBlock", raw: m[0], formula: m[1].trim() };
  },
  renderer: (token) =>
    `<div class="katex-display-wrap">${renderKatex(token.formula, true)}</div>`,
};

marked.use({ extensions: [mathBlockExt, mathInlineExt] });
```

**Supporta:**

- ✅ Markdown standard (heading, bold, italic, link, liste, code block)
- ✅ Heading con id automatico → `#sezione-1`
- ✅ LaTeX inline e display → `$...$` e `$$...$$`
- ✅ Graphviz/DOT → `\`\`\`graphviz ... \`\`\``
- ✅ Mermaid → `\`\`\`mermaid ... \`\`\``

### 2. MarkdownRenderer.jsx - Componente React

Renderizza HTML dal parser + carica e visualizza grafici:

```javascript
export default function MarkdownRenderer({ content, className }) {
  const [html] = useState(() => renderMarkdown(content));

  const ref = useRef(null);

  // Effetto: carica Graphviz/Mermaid e popola i placeholder
  useEffect(() => {
    if (!ref.current) return;

    // 1. Graphviz
    ref.current
      .querySelectorAll(".graphviz-placeholder")
      .forEach(async (el) => {
        const encoded = el.dataset.dot;
        if (!encoded) return;

        const Viz = await getVizModule(); // lazy load @viz-js/viz
        try {
          const svg = await Viz.instance().render(decodeURIComponent(encoded), {
            engine: "dot",
            format: "svg",
          });
          applyThemeToSVG(svg); // Adatta tema scuro/chiaro
          scaleViewerSVG(svg); // Scala per viewer
          el.replaceWith(svg);
        } catch (err) {
          el.innerHTML = `<div class="error">Errore rendering: ${err.message}</div>`;
        }
      });

    // 2. Mermaid
    ref.current.querySelectorAll(".mermaid-placeholder").forEach(async (el) => {
      const encoded = el.dataset.mermaid;
      if (!encoded) return;

      const mermaid = await getMermaidModule(); // lazy load mermaid
      try {
        const id = `mermaid-${++mermaidRenderCounter}`;
        el.innerHTML = decodeURIComponent(encoded);
        el.id = id;
        el.className = "mermaid";
        await mermaid.render(id, decodeURIComponent(encoded));
      } catch (err) {
        el.innerHTML = `<div class="error">Errore Mermaid: ${err.message}</div>`;
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`markdown-renderer ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

**Lazy Loading:**

- Graphviz caricato solo se il markdown contiene `\`\`\`graphviz`
- Mermaid caricato solo se il markdown contiene `\`\`\`mermaid`
- Nessun impatto se non usati

### 3. Adattamento Tema per SVG (Graphviz)

```javascript
function applyThemeToSVG(svgElement) {
  // 1. Background canvas → trasparente
  const canvasPolygon = svgElement.querySelector("g.graph > polygon");
  if (canvasPolygon) {
    canvasPolygon.setAttribute("fill", "transparent");
  }

  // 2. Font di sistema su tutto
  svgElement.querySelectorAll("text, tspan").forEach((el) => {
    el.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  });

  // 3. Colore testo basato su luminanza sfondo (WCAG)
  svgElement.querySelectorAll("g.node").forEach((nodeGroup) => {
    const shape = nodeGroup.querySelector("ellipse, rect, polygon, circle");
    const fillAttr = shape?.getAttribute("fill") ?? "";

    // Sfondo trasparente/bianco → testo segue tema
    if (FILL_NONE.has(fillAttr) || FILL_WHITE.has(fillAttr)) {
      // testo = var(--color-text-primary) via CSS
    } else {
      // Sfondo scuro personalizzato → testo bianco fisso
      const color = parseHexColor(fillAttr);
      if (color && getLuminance(color) < 0.179) {
        nodeGroup.querySelectorAll("text, tspan").forEach((el) => {
          el.style.fill = "#ffffff";
        });
      }
    }
  });

  // 4. Titoli e label sul canvas → text-primary
  svgElement
    .querySelectorAll("g.graph > text, g.cluster > text")
    .forEach((el) => {
      el.style.fill = "var(--color-text-primary)";
    });
}
```

**Benefici:**

- ✅ Adatta automaticamente al tema scuro/chiaro
- ✅ Contrasto WCAG 4.5:1 garantito
- ✅ Preserva colori personalizzati dell'utente
- ✅ Nessuna modifica al markdown originale

---

## ✏️ RichTextModal - Editor

### Due Modalità

#### Modalità TXT (contentEditable)

```javascript
// Container con position: absolute (fixed height)
<div style={{ height: "480px", position: "relative" }}>
  {/* Editor TXT — contentEditable */}
  <div
    ref={editorRef}
    contentEditable
    onInput={handleEditorInput}
    onKeyDown={handleEditorKeyDown}
    onPaste={handleEditorPaste}
    style={{
      position: "absolute",
      inset: 0, // Riempie il container
      overflow: "auto",
      padding: "12px",
    }}
  />

  {/* Toolbar - onMouseDown preventDefault → non perde focus */}
  <div onMouseDown={(e) => e.preventDefault()}>
    <button onClick={toggleBold} className={isBold ? "active" : ""}>
      <BoldIcon />
    </button>
    <button onClick={toggleItalic} className={isItalic ? "active" : ""}>
      <ItalicIcon />
    </button>
    <ColorPicker
      colors={TEXT_COLORS}
      activeColor={activeColor}
      onColorSelect={applyColor}
    />
  </div>
</div>;

// Gestione comandi
const toggleBold = () => {
  document.execCommand("bold", false, null);
  syncToolbar(); // Aggiorna stato bottoni
};

const applyColor = (hex) => {
  document.execCommand("foreColor", false, hex);
};
```

**Comandi execCommand supportati:**

- `bold` → `<strong>`
- `italic` → `<em>`
- `foreColor` → `<span style="color: ...">` (20 colori predefiniti)
- `insertLineBreak` → `Shift+Enter`
- `insertParagraph` → `Enter`
- Paste → solo testo plain (nessun HTML esterno)

#### Modalità Markdown (textarea)

````javascript
// Container con position: absolute (fixed height)
<div style={{ height: "480px", position: "relative" }}>
  {/* Textarea plain per markdown */}
  <textarea
    ref={textareaRef}
    value={mdContent}
    onChange={(e) => setMdContent(e.target.value)}
    style={{
      position: "absolute",
      inset: 0,
      fontFamily: "monospace",
      resize: "none",
      padding: "12px",
    }}
  />

  {/* Toolbar */}
  <div>
    {/* Guida sintassi Markdown */}
    <div ref={mdHelpRef} className="dropdown">
      <button onClick={() => setShowMdHelp(!showMdHelp)}>
        <InfoIcon /> Guida
      </button>
      {showMdHelp && (
        <div className="dropdown-content">
          {MARKDOWN_GUIDE.map(({ syntax, desc }) => (
            <div key={syntax}>
              <code>{syntax}</code> → {desc}
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Esporta PDF */}
    <button onClick={handleExportPdf} disabled={isExporting}>
      <DownloadIcon /> PDF
    </button>

    {/* Copy */}
    <button
      onClick={() => {
        navigator.clipboard.writeText(mdContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }}
    >
      <CopyIcon /> {isCopied ? "Copiato!" : "Copia"}
    </button>
  </div>
</div>;

// Guida Markdown
const MARKDOWN_GUIDE = [
  { syntax: "# Titolo 1", desc: "Titolo grande" },
  { syntax: "## Titolo 2", desc: "Titolo medio" },
  { syntax: "### Titolo 3", desc: "Titolo piccolo" },
  { syntax: "**testo**", desc: "Grassetto" },
  { syntax: "*testo*", desc: "Corsivo" },
  { syntax: "~~testo~~", desc: "Barrato" },
  { syntax: "- elemento", desc: "Lista puntata" },
  { syntax: "1. elemento", desc: "Lista numerata" },
  { syntax: "`codice`", desc: "Codice inline" },
  { syntax: "```\nblocco\n```", desc: "Blocco codice" },
  { syntax: "---", desc: "Riga divisoria" },
  { syntax: "[testo](url)", desc: "Link" },
];
````

### Cambio Modalità TXT ↔ Markdown

```javascript
const switchMode = (newMode) => {
  if (lockedMode) return; // Bloccato dall'esterno
  if (newMode === mode) return;

  if (newMode === "markdown") {
    // TXT → Markdown: estrai solo testo plain
    const text = editorRef.current?.innerText || "";
    setMdContent(text);

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }, 50);
  } else {
    // Markdown → TXT: porta plain text in editor
    if (editorRef.current) {
      editorRef.current.innerHTML = mdContent;
      editorRef.current.focus();
      // Seleziona tutto
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  }

  setMode(newMode);
};
```

**Layout Tecnico:**

- Container: `height: 480px; position: relative`
- Entrambi i panel: `position: absolute; inset: 0` (riempiono container)
- Panel inattivo: `display: none`
- **Beneficio**: Zero resize modale, cambio istantaneo

---

## 🎨 SplitModal - Layout Flessibile

Gestisce layout a colonne dinamico con scrollbar indipendenti:

```javascript
const layout = {
  type: "row",  // riga
  children: [
    {
      type: "column",      // colonna
      flex: "0 1 400px",   // max-width 400px, shrink allowed
      minWidth: "280px",   // minimo 280px
      children: [
        {
          type: "panel",
          title: "Indice",
          content: <TocContent ... />,
          contentRef: tocScrollRef,
        },
        {
          type: "panel",
          title: "Strumenti",
          flex: "0 0 auto",
          content: <StrumentiContent ... />,
        },
      ],
    },
    {
      type: "column",           // contenuto centrale
      flex: 1,                  // Prende tutto lo spazio rimanente
      children: [{
        type: "panel",
        content: <MarkdownRenderer ... />,
        contentRef: centerScrollRef,  // Ref per tracking posizione
      }],
    },
  ],
};

// Responsività
const isMobile = useIsMobile();  // breakpoint 640px

// Mobile: cambio layout a stack verticale
const layout = isMobile ? {
  type: "column",
  children: [
    { /* TOC */ },
    { /* Contenuto */ },
    { /* Strumenti */ },
  ]
} : layout;
```

**Caratteristiche:**

- ✅ Ogni pannello ha scrollbar indipendente
- ✅ Scroll contenuto NON muove TOC/Strumenti
- ✅ Close button: freccia ← mobile, X desktop
- ✅ Header opzionale per ogni pannello
- ✅ Footer opzionale con bottone conferma

---

## 🔄 Flusso Completo di Interazione

```
User visualizza MarkdownBox
          ↓
[Click sul box preview]
          ↓
setIsViewerOpen(true)
          ↓
NoteViewerModal si apre
          ↓
SplitModal renderizza layout a 3 colonne
          ↓
├── [SX] Estrae TOC dal markdown
│        ├── renderMarkdown(content) → HTML
│        ├── Cerchi h1-h6 con id
│        ├── Filtra sezione indice
│        └── Mostra heading e-h2 max nel TOC
│
├── [CENTRO] MarkdownRenderer renderizza contenuto
│           ├── Carica Graphviz (lazy)
│           ├── Carica Mermaid (lazy)
│           ├── Applica tema SVG
│           ├── Scala SVG per viewer
│           └── Renderizza KaTeX
│
└── Tracciamento Posizione
    ├── AddEventListener("scroll", handleScroll)
    ├── Per ogni heading: calcola se visibile
    ├── Primo visibile OR più recente letto
    └── Highlight nel TOC + scroll TOC per visibilità

User scorre nel contenuto centrale
          ↓
handleScroll dispara requestAnimationFrame
          ↓
Calcola activeSlug (heading visibile/più recente)
          ↓
TocContent re-render: highlight + scroll
          ↓
activeItemRef.scrollIntoView() nel TOC

User clicca heading nel TOC
          ↓
onHeadingClick(slug)
          ↓
container.querySelector(`[id="${slug}"]`)
          ↓
.scrollIntoView({ smooth })  — SOLO nel pannello centrale
          ↓
Contenuto scorre, tracking aggiorna heading attivo

User modifica zoom
          ↓
setScale(newScale)
          ↓
scale entra nei dep array
          ↓
useEffect tracking si riattiva
          ↓
Ricalcola heading visibili con le nuove coordinate
          ↓
Highlight/TOC si aggiornano

User vuole modificare
          ↓
[Click "Modifica markdown" dal menu]
          ↓
setIsEditNoteOpen(true)
          ↓
RichTextModal si apre
          ↓
├── Se modalità TXT: contentEditable con toolbar
├── Se modalità Markdown: textarea con guida sintassi
└── Bottone conferma → handleNoteConfirm(content, type)

handleNoteConfirm
          ↓
await onContentChange(newContent, "markdown")
          ↓
updateBentoBoxContent(projectId, boxId, content)
          ↓
Firestore doc update
          ↓
onSnapshot listener trigger
          ↓
ProjectPage state aggiorna
          ↓
MarkdownBox re-render con nuovo content
          ↓
Anteprima aggiornata (truncata a 20 righe)
```

---

## 🎭 Stati e Transitions

```
MarkdownBox
├── isViewerOpen: false → [click box] → true
│                  true → [close modal] → false
│
└── isEditNoteOpen: false → [click "Modifica"] → true
                    true → [save/cancel] → false

NoteViewerModal
├── activeSlug: null → [scroll] → headingId
│               headingId → [scroll to altro] → altroHeadingId
│
└── scale: 100% → [click −/+] → 50%-250%

RichTextModal
├── mode: "txt" ↔ [click toggle] ↔ "markdown"
├── isBold/isItalic: [syncToolbar on selection change]
└── activeColor: [applyColor]
```

---

## 📊 Performance Considerations

| Problema                           | Soluzione                                  |
| ---------------------------------- | ------------------------------------------ |
| **Parser Markdown costoso**        | Truncatura box: solo 20 righe              |
| **Graphviz WASM grande**           | Lazy load: carica solo se usato            |
| **Mermaid parsing lento**          | Lazy load: carica solo se usato            |
| **Scroll listener sempre in fire** | requestAnimationFrame: max 60fps           |
| **SVG rendering senza width**      | `scaleViewerSVG()` imposta width esplicita |
| **Font SVG non segue tema**        | `applyThemeToSVG()`: tema + contrasto WCAG |
| **Resize modale al cambio editor** | Layout assoluto: zero resize               |
| **Multiple re-render tracking**    | `scale` nei deps: re-calculate una volta   |

---

## 🔧 Props e Callbacks

### MarkdownBox → NoteViewerModal

```javascript
<NoteViewerModal
  isOpen={isViewerOpen}
  onClose={() => setIsViewerOpen(false)}
  title={title}
  content={content} // Completo, non troncato
  contentType="markdown" // Attiva layout 3 colonne
/>
```

### NoteViewerModal → RichTextModal

```javascript
<RichTextModal
  isOpen={isEditNoteOpen}
  onClose={() => setIsEditNoteOpen(false)}
  onConfirm={handleNoteConfirm} // (content, contentType) => void
  initialContent={content}
  contentType="markdown"
  noteTitle={title}
  lockedMode="markdown" // Opzionale: blocca cambio modalità
/>
```

---

## 🎯 Casi d'Uso Comuni

### 1. Visualizzare una nota markdown completa

```
Click MarkdownBox → NoteViewerModal apre → Leggi con TOC
```

### 2. Seguire la lettura con il TOC

```
Scroll contenuto → heading attivo cambia → TOC evidenzia
→ TOC scorre per visibilità
```

### 3. Saltare a una sezione

```
Click heading nel TOC → Scroll solo nel contenuto centrale
→ Heading diventa attivo
```

### 4. Modificare una nota

```
Click "Modifica markdown" → RichTextModal apre
→ Scegli TXT o Markdown
→ Modifica → Click "Salva"
→ Firestore aggiorna → MarkdownBox refresh
```

### 5. Esportare in PDF

```
RichTextModal (modalità Markdown)
→ Click "Download PDF"
→ exportNoteToPdf() genera file
→ Browser lo scarica
```

---

## 📝 Note Tecniche Importanti

1. **ID Heading Auto-generati**  
   Markdown non specula gli `id`. Il renderer `marked` li crea automaticamente usando la convenzione GFM (slug from text).

2. **Filteraggio Sezione Indice**  
   Se il markdown include un indice auto-generato (es. rmarkdown, Sphinx), il TOC lo esclude perché identifica heading che contengono solo link interni `[Sezione](#slug)`.

3. **Scrollbar Indipendenti**  
   SplitModal non usa CSS Grid: è un albero di div con `overflow-y: auto`. Ogni pannello ha la sua scrollbar.

4. **Tracking Position Funziona anche al Zoom**  
   Il viewport rect cambia quando il contenuto è scalato (transform: scale). L'effetto ri-attiva il tracking su `scale` change.

5. **Lazy Load Graphviz e Mermaid**  
   Nessuna richiesta di rete se non presenti. L'import dinamico avviene solo nel `useEffect`.

6. **Copy da Plain Editor**  
   `execCommand("insertText", false, text)` inserisce testo piano, non HTML, in contentEditable.

7. **Focus Management**
   - `onMouseDown={e => e.preventDefault()}` sulla toolbar → mantiene focus editor
   - Focus async con `setTimeout(..., 100)` → assicura DOM pronto

---

## 🚀 Conclusioni

Il sistema di visualizzazione markdown è progettato per:

✅ **Leggibilità** — Anteprima nel box + viewer fullscreen  
✅ **Navigazione** — TOC intelligente con tracking posizione  
✅ **Supporto Rich Content** — Graphviz, Mermaid, LaTeX  
✅ **Performance** — Lazy loading, truncatura, cacheing  
✅ **Responsive** — Desktop 3 colonne, mobile stack verticale  
✅ **Editing** — Due modalità (TXT ricco, Markdown plain)  
✅ **Export** — PDF per le note markdown  
✅ **Tema** — Adattamento automatico scuro/chiaro + contrasto WCAG

Il tutto senza dipendenze pesanti: markdown è una semplice textarea, i grafici si caricano on-demand.
