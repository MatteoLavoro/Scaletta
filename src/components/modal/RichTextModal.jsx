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

const RichTextModal = ({ isOpen, onClose, onConfirm, initialContent = "" }) => {
  const editorRef = useRef(null);
  const [hasContent, setHasContent] = useState(false);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const colorPickerRef = useRef(null);

  // Inizializza il contenuto quando il modale si apre
  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = initialContent;
      const text = editorRef.current.innerText.trim();
      setHasContent(text.length > 0);

      // Focus automatico sull'editor
      setTimeout(() => {
        editorRef.current?.focus();
        // Posiziona il cursore alla fine del testo
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }, 100);
    }
  }, [isOpen, initialContent]);

  // Chiudi il color picker quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target)
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

  // Aggiorna lo stato dei pulsanti in base alla selezione
  const updateToolbarState = () => {
    setIsBoldActive(document.queryCommandState("bold"));
    setIsItalicActive(document.queryCommandState("italic"));

    // Ottieni il colore corrente
    const color = document.queryCommandValue("foreColor");
    if (color) {
      // Converte rgb a hex
      const rgb = color.match(/\d+/g);
      if (rgb) {
        const hex = `#${(
          (1 << 24) +
          (parseInt(rgb[0]) << 16) +
          (parseInt(rgb[1]) << 8) +
          parseInt(rgb[2])
        )
          .toString(16)
          .slice(1)}`;
        setCurrentColor(hex);
      }
    }
  };

  // Gestisce l'input nell'editor
  const handleInput = () => {
    // Aggiorna lo stato hasContent
    if (editorRef.current) {
      const text = editorRef.current.innerText.trim();
      setHasContent(text.length > 0);
    }
    updateToolbarState();
  };

  // Gestisce la selezione del testo
  const handleSelect = () => {
    updateToolbarState();
  };

  // Gestisce il tasto Enter (shift+enter per a capo)
  const handleKeyDown = (e) => {
    // Shift + Enter per andare a capo
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
    // Enter normale per nuovo paragrafo
    else if (e.key === "Enter") {
      e.preventDefault();
      document.execCommand("insertParagraph");
    }
  };

  // Applica formattazione grassetto
  const toggleBold = () => {
    document.execCommand("bold", false, null);
    editorRef.current?.focus();
    updateToolbarState();
  };

  // Applica formattazione corsivo
  const toggleItalic = () => {
    document.execCommand("italic", false, null);
    editorRef.current?.focus();
    updateToolbarState();
  };

  // Applica colore al testo
  const applyColor = (colorHex) => {
    document.execCommand("foreColor", false, colorHex);
    setCurrentColor(colorHex);
    setShowColorPicker(false);
    editorRef.current?.focus();
    updateToolbarState();
  };

  // Gestisce il paste: rimuove tutta la formattazione e incolla solo testo semplice
  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData(
      "text/plain",
    );
    if (text) {
      document.execCommand("insertText", false, text);
    }
  };

  // Conferma e salva
  const handleConfirm = () => {
    let html = editorRef.current.innerHTML;

    // Rimuovi tag vuoti nel mezzo
    html = html
      .replace(/<p><br><\/p>/g, "<br>")
      .replace(/<div><br><\/div>/g, "<br>")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<div>\s*<\/div>/g, "")
      .trim();

    // Rimuovi in modo aggressivo tutti gli elementi vuoti alla fine
    // Continua a rimuovere finché ci sono tag vuoti alla fine
    let previousHtml = "";
    while (previousHtml !== html) {
      previousHtml = html;
      html = html
        .replace(/(<br\s*\/?\s*>\s*)+$/gi, "")
        .replace(/(<p>\s*<\/p>\s*)+$/gi, "")
        .replace(/(<div>\s*<\/div>\s*)+$/gi, "")
        .replace(/(<p><br\s*\/?\s*><\/p>\s*)+$/gi, "")
        .replace(/(<div><br\s*\/?\s*><\/div>\s*)+$/gi, "")
        .trim();
    }

    onConfirm(html);
  };

  // Ottieni il nome del colore corrente
  const getCurrentColorName = () => {
    const color = TEXT_COLORS.find(
      (c) => c.hex.toLowerCase() === currentColor.toLowerCase(),
    );
    return color ? color.name : "Colore";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifica nota"
      variant="primary"
      confirmLabel="Salva"
      confirmDisabled={!hasContent}
      onConfirm={handleConfirm}
    >
      <div className="space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg border border-border">
          {/* Grassetto */}
          <button
            type="button"
            onClick={toggleBold}
            className={`p-2 rounded transition-colors ${
              isBoldActive
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
              isItalicActive
                ? "bg-primary text-white"
                : "hover:bg-bg-primary text-text-primary"
            }`}
            title="Corsivo"
          >
            <ItalicIcon size={20} />
          </button>

          {/* Separatore */}
          <div className="w-px h-6 bg-border" />

          {/* Colore testo - allineato a destra */}
          <div className="relative ml-auto" ref={colorPickerRef}>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
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
                className={`text-text-muted transition-transform ${
                  showColorPicker ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Color picker dropdown */}
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-1 p-3 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 animate-dropdown-in">
                <div className="grid grid-cols-5 gap-2 w-max">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => applyColor(color.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        currentColor.toLowerCase() === color.hex.toLowerCase()
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

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          autoFocus
          suppressContentEditableWarning
          onInput={handleInput}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            // Previeni la perdita di focus
            setTimeout(() => {
              if (
                editorRef.current &&
                document.activeElement !== editorRef.current
              ) {
                editorRef.current.focus();
              }
            }, 0);
          }}
          className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 bg-bg-tertiary rounded-lg border border-border text-text-primary focus:outline-none"
          style={{
            lineHeight: "1.6",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
          }}
        />
      </div>
    </Modal>
  );
};

export default RichTextModal;
