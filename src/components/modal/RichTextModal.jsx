import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import {
  BoldIcon,
  ItalicIcon,
  InfoIcon,
  ChevronDownIcon,
  CopyIcon,
  DownloadIcon,
} from "../icons";
import { exportNoteToPdf } from "../../services/pdfExport";

// ─── Costanti ─────────────────────────────────────────────────────────────────
// Altezza fissa del container editor (px).
// Entrambi i panel (TXT e Markdown) occupano esattamente questa altezza,
// quindi il cambio modalità non causa mai un resize del modale.
const EDITOR_HEIGHT = 480;

// ─── Colori testo disponibili ─────────────────────────────────────────────────
const TEXT_COLORS = [
  { id: "black", name: "Nero", hex: "#000000" },
  { id: "gray", name: "Grigio", hex: "#666666" },
  { id: "white", name: "Bianco", hex: "#ffffff" },
  { id: "red", name: "Rosso", hex: "#ef4444" },
  { id: "deepOrange", name: "Rosso Arancio", hex: "#ff5722" },
  { id: "orange", name: "Arancio", hex: "#ff9800" },
  { id: "amber", name: "Ambra", hex: "#ffc107" },
  { id: "yellow", name: "Giallo", hex: "#ffeb3b" },
  { id: "lime", name: "Lime", hex: "#cddc39" },
  { id: "lightGreen", name: "Verde Chiaro", hex: "#8bc34a" },
  { id: "green", name: "Verde", hex: "#4caf50" },
  { id: "teal", name: "Verde Acqua", hex: "#009688" },
  { id: "cyan", name: "Ciano", hex: "#00bcd4" },
  { id: "lightBlue", name: "Azzurro", hex: "#03a9f4" },
  { id: "blue", name: "Blu", hex: "#2196f3" },
  { id: "indigo", name: "Indaco", hex: "#3f51b5" },
  { id: "deepPurple", name: "Viola Scuro", hex: "#673ab7" },
  { id: "purple", name: "Viola", hex: "#9c27b0" },
  { id: "pink", name: "Rosa", hex: "#e91e63" },
  { id: "brown", name: "Marrone", hex: "#795548" },
];

// ─── Guida sintassi Markdown ──────────────────────────────────────────────────
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

/**
 * RichTextModal - Editor di testo per le note, completamente ridisegnato.
 *
 * Supporta due modalità:
 *  - "txt": editor rich text con grassetto, corsivo, colori (execCommand)
 *  - "markdown": textarea plain per la sintassi Markdown
 *
 * Tecnica di layout: position-absolute panels.
 * Container: position:relative con height fissa (EDITOR_HEIGHT px).
 * Ogni panel: position:absolute; inset:0 → riempie esattamente il container.
 * Panel inattivo: display:none (Tailwind "hidden").
 *   - Nessun contributo all'altezza → zero resize al cambio modalità
 *   - Il ref dell'elemento rimane valido → si può leggere/scrivere HTML/value
 *   - Nessuna dipendenza da height:100% dentro h-fit (ambiguo nei browser)
 *
 * Toolbar TXT anti-blur: onMouseDown={(e) => e.preventDefault()} sul container
 * toolbar impedisce che qualsiasi click tolga il focus al contentEditable,
 * preservando la selezione di testo quando si clicca su Bold/Italic/Colori.
 *
 * @param {boolean}  isOpen         - Stato apertura
 * @param {function} onClose        - Callback chiusura
 * @param {function} onConfirm      - Callback salvataggio: (content, contentType) => void
 * @param {string}   initialContent - Contenuto iniziale
 * @param {string}   contentType    - Modalità iniziale: "txt" | "markdown" (default "txt")
 */
const RichTextModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialContent = "",
  contentType = "txt",
  noteTitle = "",
  lockedMode = null, // null | "txt" | "markdown" — se impostato, blocca la modalità e nasconde il toggle
}) => {
  // ─── Refs ─────────────────────────────────────────────────────────────────
  const editorRef = useRef(null); // contentEditable TXT
  const textareaRef = useRef(null); // textarea Markdown
  const colorPickerRef = useRef(null); // container dropdown colori
  const mdHelpRef = useRef(null); // container dropdown guida markdown

  // ─── State ────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState(contentType || "txt");
  const [mdContent, setMdContent] = useState("");
  const [hasContent, setHasContent] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [activeColor, setActiveColor] = useState("#000000");
  const [showMdHelp, setShowMdHelp] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Inizializzazione al mount / riapertura ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const m = lockedMode || contentType || "txt";
    setMode(m);
    setShowColors(false);
    setShowMdHelp(false);
    setIsCopied(false);

    // Auto-focus solo per note nuove (contenuto vuoto); per le modifiche il
    // click sull'editor è più naturale.
    const isNew = !initialContent || initialContent.trim().length === 0;

    if (m === "markdown") {
      setMdContent(initialContent || "");
      setHasContent((initialContent || "").trim().length > 0);
      // Pulisci l'editor TXT (il ref rimane valido anche con display:none)
      if (editorRef.current) editorRef.current.innerHTML = "";
      if (isNew) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    } else {
      setMdContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent || "";
        setHasContent(editorRef.current.innerText.trim().length > 0);
        if (isNew) {
          setTimeout(() => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            try {
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(editorRef.current);
              range.collapse(false);
              sel.removeAllRanges();
              sel.addRange(range);
            } catch (_) {
              /* noop */
            }
          }, 100);
        }
      }
    }
  }, [isOpen, initialContent, contentType]);

  // ─── Chiudi dropdown colori al click esterno ─────────────────────────────
  useEffect(() => {
    if (!showColors) return;
    const fn = (e) => {
      if (!colorPickerRef.current?.contains(e.target)) setShowColors(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showColors]);

  // ─── Chiudi guida Markdown al click esterno ──────────────────────────────
  useEffect(() => {
    if (!showMdHelp) return;
    const fn = (e) => {
      if (!mdHelpRef.current?.contains(e.target)) setShowMdHelp(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [showMdHelp]);

  // ─── Cambio modalità (TXT ↔ Markdown) ───────────────────────────────────
  const switchMode = (newMode) => {
    if (lockedMode) return; // bloccato — cambio modalità disabilitato
    if (newMode === mode) return;

    if (newMode === "markdown") {
      // Porta il plain text dall'editor TXT alla textarea MD
      const text = editorRef.current?.innerText || "";
      setMdContent(text);
      setHasContent(text.trim().length > 0);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, 50);
    } else {
      // Porta il testo MD nell'editor TXT (plain, senza formattazione)
      if (editorRef.current) {
        editorRef.current.innerHTML = mdContent;
        setHasContent(mdContent.trim().length > 0);
        setTimeout(() => {
          if (!editorRef.current) return;
          editorRef.current.focus();
          try {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (_) {
            /* noop */
          }
        }, 50);
      }
    }

    setMode(newMode);
    setShowColors(false);
    setShowMdHelp(false);
  };

  // ─── Toolbar TXT ─────────────────────────────────────────────────────────
  /**
   * Sincronizza lo stato dei bottoni toolbar (Bold/Italic/Colore)
   * con la selezione corrente dell'editor.
   */
  const syncToolbar = () => {
    setIsBold(document.queryCommandState("bold"));
    setIsItalic(document.queryCommandState("italic"));
    const rawColor = document.queryCommandValue("foreColor");
    if (rawColor) {
      const rgb = rawColor.match(/\d+/g);
      if (rgb) {
        const hex = `#${(
          (1 << 24) +
          (parseInt(rgb[0]) << 16) +
          (parseInt(rgb[1]) << 8) +
          parseInt(rgb[2])
        )
          .toString(16)
          .slice(1)}`;
        setActiveColor(hex);
      }
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current)
      setHasContent(editorRef.current.innerText.trim().length > 0);
    syncToolbar();
  };

  const handleEditorKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    } else if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertParagraph");
    }
  };

  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData(
      "text/plain",
    );
    if (text) document.execCommand("insertText", false, text);
  };

  const toggleBold = () => {
    document.execCommand("bold", false, null);
    syncToolbar();
  };

  const toggleItalic = () => {
    document.execCommand("italic", false, null);
    syncToolbar();
  };

  const applyColor = (hex) => {
    document.execCommand("foreColor", false, hex);
    setActiveColor(hex);
    setShowColors(false);
    syncToolbar();
  };

  const activeColorName =
    TEXT_COLORS.find((c) => c.hex.toLowerCase() === activeColor.toLowerCase())
      ?.name || "Colore";

  // ─── Esporta PDF dalla nota Markdown ──────────────────────────────────────
  const handleExportPdf = async () => {
    if (isExporting || mdContent.trim().length === 0) return;
    setIsExporting(true);
    try {
      await exportNoteToPdf(noteTitle || "Nota", mdContent);
    } catch (err) {
      // Mostra l'errore all'utente solo se è un problema bloccante (popup bloccati)
      if (err?.message) {
        alert(err.message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Copia testo Markdown ─────────────────────────────────────────────────
  const handleCopyMd = () => {
    navigator.clipboard
      .writeText(mdContent)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(() => {});
  };

  // ─── Conferma e salva ─────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (mode === "markdown") {
      onConfirm(mdContent.trim(), "markdown");
      return;
    }
    // Pulisci HTML: rimuovi paragrafi/div vuoti e <br> finali
    let html = editorRef.current?.innerHTML || "";
    html = html
      .replace(/<p><br><\/p>/g, "<br>")
      .replace(/<div><br><\/div>/g, "<br>")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<div>\s*<\/div>/g, "")
      .trim();
    let prev = "";
    while (prev !== html) {
      prev = html;
      html = html
        .replace(/(<br\s*\/?\s*>\s*)+$/gi, "")
        .replace(/(<p>\s*<\/p>\s*)+$/gi, "")
        .replace(/(<div>\s*<\/div>\s*)+$/gi, "")
        .replace(/(<p><br\s*\/?\s*><\/p>\s*)+$/gi, "")
        .replace(/(<div><br\s*\/?\s*><\/div>\s*)+$/gi, "")
        .trim();
    }
    onConfirm(html, "txt");
  };

  const confirmDisabled =
    mode === "txt" ? !hasContent : mdContent.trim().length === 0;

  const isTxt = mode === "txt";
  const isMd = mode === "markdown";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica nota"
      confirmText="Salva"
      confirmDisabled={confirmDisabled}
      onConfirm={handleConfirm}
      maxWidth="max-w-[992px]"
    >
      <div className="flex flex-col gap-3">
        {/* ── Selettore modalità TXT / Markdown ─────────────────────────── */}
        {/* nascosto quando la modalità è bloccata (lockedMode) */}
        <div
          className={`flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg border border-border${lockedMode ? " hidden" : ""}`}
        >
          <button
            type="button"
            onClick={() => switchMode("txt")}
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              isTxt
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            TXT
          </button>
          <button
            type="button"
            onClick={() => switchMode("markdown")}
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              isMd
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Markdown
          </button>
        </div>

        {/*
         * ── Area editor con panels sovrapposti ─────────────────────────────
         *
         * Container position:relative con altezza fissa (EDITOR_HEIGHT px).
         * Ogni panel è position:absolute; inset:0 → riempie esattamente il container.
         *
         * Il panel inattivo è nascosto con className="hidden" (display:none):
         *  ✓ Completamente fuori dal layout → nessun contributo all'altezza
         *  ✓ Il DOM element esiste → i ref rimangono validi (innerHTML/value leggibili)
         *  ✓ Altezza container invariante al cambio modalità → zero layout shift
         *
         * Toolbar TXT: onMouseDown con e.preventDefault() su tutto il container.
         * Impedisce che qualsiasi click nella toolbar tolga il focus all'editor,
         * preservando la selezione quando si clicca Bold/Italic/Colori.
         */}
        <div className="relative" style={{ height: EDITOR_HEIGHT }}>
          {/* ── Panel TXT ────────────────────────────────────────────────── */}
          <div
            className={`absolute inset-0 flex flex-col gap-3 ${isTxt ? "" : "hidden"}`}
          >
            {/* Toolbar TXT */}
            <div
              className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border shrink-0"
              onMouseDown={(e) => e.preventDefault()}
            >
              {/* Grassetto */}
              <button
                type="button"
                onClick={toggleBold}
                className={`p-2 rounded transition-colors ${
                  isBold
                    ? "bg-primary text-white"
                    : "hover:bg-bg-primary text-text-primary"
                }`}
                title="Grassetto"
              >
                <BoldIcon size={20} />
              </button>

              {/* Corsivo */}
              <button
                type="button"
                onClick={toggleItalic}
                className={`p-2 rounded transition-colors ${
                  isItalic
                    ? "bg-primary text-white"
                    : "hover:bg-bg-primary text-text-primary"
                }`}
                title="Corsivo"
              >
                <ItalicIcon size={20} />
              </button>

              {/* Separatore */}
              <div className="w-px h-6 bg-border mx-1" />

              {/* Color picker */}
              <div className="relative ml-auto" ref={colorPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowColors(!showColors)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-primary transition-colors"
                  title="Colore testo"
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: activeColor }}
                  />
                  <span className="text-sm text-text-primary">
                    {activeColorName}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`text-text-muted transition-transform ${showColors ? "rotate-180" : ""}`}
                  />
                </button>

                {showColors && (
                  <div className="absolute top-full right-0 mt-1 p-3 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 animate-dropdown-in">
                    <div className="grid grid-cols-5 gap-2 w-max">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => applyColor(c.hex)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            activeColor.toLowerCase() === c.hex.toLowerCase()
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editor contentEditable */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onSelect={syncToolbar}
              onKeyDown={handleEditorKeyDown}
              onPaste={handleEditorPaste}
              className="flex-1 min-h-0 overflow-y-auto p-4 bg-bg-tertiary rounded-lg border border-border text-text-primary focus:outline-none"
              style={{
                lineHeight: "1.6",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            />
          </div>

          {/* ── Panel Markdown ───────────────────────────────────────────── */}
          <div
            className={`absolute inset-0 flex flex-col gap-3 ${isMd ? "" : "hidden"}`}
          >
            {/* Toolbar Markdown */}
            <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border shrink-0">
              {/* Copia testo */}
              <button
                type="button"
                onClick={handleCopyMd}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-primary transition-colors"
                title="Copia tutto il testo"
              >
                <CopyIcon
                  className={`w-5 h-5 ${isCopied ? "text-primary" : "text-text-primary"}`}
                />
                <span
                  className={`text-sm ${isCopied ? "text-primary font-medium" : "text-text-primary"}`}
                >
                  {isCopied ? "Copiato!" : "Copia testo"}
                </span>
              </button>

              {/* Separatore */}
              <div className="w-px h-6 bg-border mx-0.5 shrink-0" />

              {/* Esporta PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting || mdContent.trim().length === 0}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Esporta come PDF"
              >
                <DownloadIcon
                  className={`w-5 h-5 ${isExporting ? "text-primary animate-pulse" : "text-text-primary"}`}
                />
                <span
                  className={`text-sm ${isExporting ? "text-primary font-medium" : "text-text-primary"}`}
                >
                  {isExporting ? "Generazione…" : "Esporta PDF"}
                </span>
              </button>

              {/* Guida Markdown */}
              <div className="relative ml-auto" ref={mdHelpRef}>
                <button
                  type="button"
                  onClick={() => setShowMdHelp(!showMdHelp)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-primary transition-colors"
                  title="Guida sintassi Markdown"
                >
                  <InfoIcon className="w-5 h-5 text-text-primary" />
                  <span className="text-sm text-text-primary">
                    Guida Markdown
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`text-text-muted transition-transform ${showMdHelp ? "rotate-180" : ""}`}
                  />
                </button>

                {showMdHelp && (
                  <div className="absolute top-full right-0 mt-1 p-4 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 animate-dropdown-in w-72">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
                      Sintassi Markdown
                    </p>
                    <div className="flex flex-col gap-2">
                      {MARKDOWN_GUIDE.map(({ syntax, desc }) => (
                        <div
                          key={syntax}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <code className="text-xs font-mono bg-bg-tertiary px-1.5 py-0.5 rounded text-primary whitespace-pre">
                            {syntax}
                          </code>
                          <span className="text-xs text-text-muted shrink-0">
                            {desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Textarea Markdown */}
            <textarea
              ref={textareaRef}
              value={mdContent}
              onChange={(e) => {
                setMdContent(e.target.value);
                setHasContent(e.target.value.trim().length > 0);
              }}
              placeholder={
                "Scrivi in Markdown...\n\n# Titolo\n## Sottotitolo\n\n**grassetto**, *corsivo*, ~~barrato~~\n\n- Elemento lista\n- Elemento lista\n\n```\nblocco codice\n```"
              }
              className="flex-1 min-h-0 w-full p-4 bg-bg-tertiary rounded-lg border border-border text-text-primary focus:outline-none resize-none text-sm overflow-y-auto"
              style={{ fontFamily: "inherit", lineHeight: "1.6" }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RichTextModal;
