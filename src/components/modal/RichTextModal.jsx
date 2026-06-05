import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { BoldIcon, ItalicIcon } from "../icons";
import { ChevronDownIcon } from "../icons";

// 20 colori in scala cromatica (dall'arcobaleno)
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

/**
 * RichTextModal - Editor di testo per le note.
 *
 * Supporta due modalità:
 *  - "txt": editor rich text con grassetto, corsivo, colori.
 *  - "markdown": textarea plain per scrivere in sintassi Markdown.
 *
 * Tecnica di layout: CSS Grid stacking.
 * Il layer TXT (toolbar + editor) e il layer Markdown (textarea) sono
 * sempre nel DOM e sovrapposti nella stessa cella grid tramite gridArea.
 * Si usa visibility:hidden (non display:none) per nasconderli, così la
 * cella grid mantiene sempre l'altezza del layer TXT, e il modale non
 * cambia mai dimensione quando si cambia modalità.
 *
 * @param {boolean} isOpen        - Stato apertura
 * @param {function} onClose      - Callback chiusura
 * @param {function} onConfirm    - Callback salvataggio: (content, contentType) => void
 * @param {string}   initialContent - Contenuto iniziale
 * @param {string}   contentType  - Tipo iniziale: "txt" | "markdown" (default "txt")
 */
const RichTextModal = ({
  isOpen,
  onClose,
  onConfirm,
  initialContent = "",
  contentType = "txt",
}) => {
  // ─── Refs ───────────────────────────────────────────────────
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const colorPickerRef = useRef(null);
  const modeRef = useRef(contentType || "txt");

  // ─── State ──────────────────────────────────────────────────
  const [localContentType, setLocalContentType] = useState(
    contentType || "txt",
  );
  const [markdownContent, setMarkdownContent] = useState("");
  const [hasContent, setHasContent] = useState(false);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");

  // ─── Inizializzazione al mount / riapertura ──────────────────
  useEffect(() => {
    if (!isOpen) return;

    const mode = contentType || "txt";
    modeRef.current = mode;
    setLocalContentType(mode);
    setShowColorPicker(false);

    // Auto-focus e cursore solo se stai aggiungendo una nota nuova (contenuto vuoto).
    // In modifica (contenuto già presente) l'utente deve cliccare per scrivere.
    const isNewNote = !initialContent || initialContent.trim().length === 0;

    if (mode === "markdown") {
      setMarkdownContent(initialContent || "");
      setHasContent((initialContent || "").trim().length > 0);
      if (editorRef.current) editorRef.current.innerHTML = "";
      if (isNewNote) {
        setTimeout(() => {
          const ta = textareaRef.current;
          if (!ta) return;
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }, 100);
      }
    } else {
      setMarkdownContent("");
      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent || "";
        setHasContent(editorRef.current.innerText.trim().length > 0);
        if (isNewNote) {
          setTimeout(() => {
            if (!editorRef.current) return;
            editorRef.current.focus();
            try {
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(editorRef.current);
              range.collapse(false); // cursore alla fine
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

  // ─── Chiudi color picker al click esterno ───────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target)
      ) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  // ─── Cambio modalità (TXT ↔ Markdown) ───────────────────────
  const switchMode = (newMode) => {
    if (newMode === modeRef.current) return;

    if (newMode === "markdown") {
      const plainText = editorRef.current?.innerText || "";
      setMarkdownContent(plainText);
      setHasContent(plainText.trim().length > 0);
      // Cursore alla fine del testo
      setTimeout(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }, 50);
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = markdownContent;
        setHasContent(markdownContent.trim().length > 0);
        // Cursore alla fine del testo
        setTimeout(() => {
          if (!editorRef.current) return;
          editorRef.current.focus();
          try {
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editorRef.current);
            range.collapse(false); // cursore alla fine
            sel.removeAllRanges();
            sel.addRange(range);
          } catch (_) {
            /* noop */
          }
        }, 50);
      }
    }

    modeRef.current = newMode;
    setLocalContentType(newMode);
    setShowColorPicker(false);
  };

  // ─── Toolbar TXT ─────────────────────────────────────────────
  const updateToolbarState = () => {
    setIsBoldActive(document.queryCommandState("bold"));
    setIsItalicActive(document.queryCommandState("italic"));
    const color = document.queryCommandValue("foreColor");
    if (color) {
      const rgb = color.match(/\d+/g);
      if (rgb) {
        const hex = `#${((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1)}`;
        setCurrentColor(hex);
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current)
      setHasContent(editorRef.current.innerText.trim().length > 0);
    updateToolbarState();
  };

  const handleSelect = () => updateToolbarState();

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    } else if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertParagraph");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData(
      "text/plain",
    );
    if (text) document.execCommand("insertText", false, text);
  };

  const toggleBold = () => {
    document.execCommand("bold", false, null);
    editorRef.current?.focus();
    updateToolbarState();
  };
  const toggleItalic = () => {
    document.execCommand("italic", false, null);
    editorRef.current?.focus();
    updateToolbarState();
  };

  const applyColor = (colorHex) => {
    document.execCommand("foreColor", false, colorHex);
    setCurrentColor(colorHex);
    setShowColorPicker(false);
    editorRef.current?.focus();
    updateToolbarState();
  };

  const getCurrentColorName = () => {
    const color = TEXT_COLORS.find(
      (c) => c.hex.toLowerCase() === currentColor.toLowerCase(),
    );
    return color ? color.name : "Colore";
  };

  // ─── Conferma e salva ────────────────────────────────────────
  const handleConfirm = () => {
    if (localContentType === "markdown") {
      onConfirm(markdownContent.trim(), "markdown");
      return;
    }
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

  const isConfirmDisabled =
    localContentType === "txt"
      ? !hasContent
      : markdownContent.trim().length === 0;
  const isTxt = localContentType === "txt";
  const isMd = localContentType === "markdown";

  // ─── Render ──────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica nota"
      confirmDisabled={isConfirmDisabled}
      onConfirm={handleConfirm}
    >
      <div className="flex flex-col gap-3">
        {/* ── Selettore modalità TXT / Markdown ── */}
        <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg border border-border">
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
         * ── Area editor: CSS Grid stacking ──
         *
         * Layer TXT (toolbar + contentEditable) e layer Markdown (textarea)
         * occupano la STESSA cella grid (gridArea "1/1/2/2").
         * Il layer TXT determina SEMPRE l'altezza della cella.
         * minHeight="366px" = toolbar(54px) + gap(12px) + editor-min(300px)
         * garantisce che anche quando il layer TXT è visibility:hidden
         * (apertura diretta in markdown) la cella mantenga la stessa altezza.
         * visibility:hidden preserva lo spazio; display:none non viene usato.
         */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr",
            minHeight: "366px",
          }}
        >
          {/* ── Layer TXT: toolbar + contentEditable (sempre in DOM) ── */}
          <div
            style={{
              gridArea: "1 / 1 / 2 / 2",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              minHeight: "366px",
              visibility: isTxt ? "visible" : "hidden",
              pointerEvents: isTxt ? "auto" : "none",
            }}
            aria-hidden={isMd}
          >
            {/* Toolbar formattazione */}
            <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border">
              {/* Grassetto */}
              <button
                type="button"
                onClick={toggleBold}
                tabIndex={isTxt ? 0 : -1}
                className={`p-2 rounded transition-colors ${isBoldActive ? "bg-primary text-white" : "hover:bg-bg-primary text-text-primary"}`}
                title="Grassetto"
              >
                <BoldIcon size={20} />
              </button>

              {/* Corsivo */}
              <button
                type="button"
                onClick={toggleItalic}
                tabIndex={isTxt ? 0 : -1}
                className={`p-2 rounded transition-colors ${isItalicActive ? "bg-primary text-white" : "hover:bg-bg-primary text-text-primary"}`}
                title="Corsivo"
              >
                <ItalicIcon size={20} />
              </button>

              {/* Separatore */}
              <div className="w-px h-6 bg-border" />

              {/* Colore testo */}
              <div className="relative ml-auto" ref={colorPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  tabIndex={isTxt ? 0 : -1}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-primary transition-colors"
                  title="Colore testo"
                >
                  <div
                    className="w-5 h-5 rounded-full border border-border"
                    style={{ backgroundColor: currentColor }}
                  />
                  <span className="text-sm text-text-primary">
                    {getCurrentColorName()}
                  </span>
                  <ChevronDownIcon
                    size={16}
                    className={`text-text-muted transition-transform ${showColorPicker ? "rotate-180" : ""}`}
                  />
                </button>

                {showColorPicker && isTxt && (
                  <div className="absolute top-full right-0 mt-1 p-3 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 animate-dropdown-in">
                    <div className="grid grid-cols-5 gap-2 w-max">
                      {TEXT_COLORS.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => applyColor(color.hex)}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                            currentColor.toLowerCase() ===
                            color.hex.toLowerCase()
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border hover:border-primary/50"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
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
              contentEditable={isTxt}
              tabIndex={isTxt ? 0 : -1}
              suppressContentEditableWarning
              onInput={handleInput}
              onSelect={handleSelect}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => {
                setTimeout(() => {
                  if (
                    modeRef.current === "txt" &&
                    editorRef.current &&
                    document.activeElement !== editorRef.current
                  ) {
                    editorRef.current.focus();
                  }
                }, 0);
              }}
              style={{
                lineHeight: "1.6",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
              className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-bg-tertiary rounded-lg border border-border text-text-primary focus:outline-none"
            />
          </div>

          {/* ── Layer Markdown: textarea (sempre in DOM, riempie la cella grid) ── */}
          <textarea
            ref={textareaRef}
            value={markdownContent}
            onChange={(e) => {
              setMarkdownContent(e.target.value);
              setHasContent(e.target.value.trim().length > 0);
            }}
            tabIndex={isMd ? 0 : -1}
            placeholder={
              "Scrivi in Markdown...\n\n# Titolo\n## Sottotitolo\n\n**grassetto**, *corsivo*, ~~barrato~~\n\n- Elemento lista\n- Elemento lista\n\n```\nblocco codice\n```"
            }
            style={{
              gridArea: "1 / 1 / 2 / 2",
              alignSelf: "stretch",
              visibility: isMd ? "visible" : "hidden",
              pointerEvents: isMd ? "auto" : "none",
              fontFamily: "inherit",
              lineHeight: "1.6",
            }}
            className="w-full p-4 bg-bg-tertiary rounded-lg border border-border text-text-primary focus:outline-none resize-none text-sm overflow-y-auto"
          />
        </div>
      </div>
    </Modal>
  );
};

export default RichTextModal;
