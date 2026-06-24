import { useState, useRef, useLayoutEffect } from "react";
import { PencilIcon, FileTextIcon, ChevronDownIcon } from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { RichTextModal, NoteViewerModal, GraphViewerModal } from "../modal";
import MarkdownRenderer from "../ui/MarkdownRenderer";

// Altezza massima (px) prima di troncare il testo nel box.
// Corrisponde a 2 bento box (2 × 320px = 640px).
const NOTE_MAX_HEIGHT = 640;

/**
 * NoteBox - Bento Box per le note
 *
 * Box specializzato per contenere una nota di testo.
 * Si auto-dimensiona in base al contenuto.
 * Ha un kebab menu con l'opzione per modificare la nota.
 *
 * @param {string} title - Titolo del box
 * @param {string} content - Contenuto della nota
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {string} createdByName - Nome utente che ha creato il box
 * @param {Date|Timestamp} createdAt - Data creazione box
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onContentChange - Callback per cambiare il contenuto
 * @param {function} onDelete - Callback per eliminare il box
 * @param {function} onSendMessageFromBox - Callback per inviare messaggio taggando questo box
 */
const NoteBox = ({
  title = "Nota",
  content = "",
  contentType = "txt",
  isPinned = false,
  createdByName = null,
  createdAt = null,
  onPinToggle,
  onTitleChange,
  onContentChange,
  onDelete,
  onSendMessageFromBox,
}) => {
  const [isEditNoteOpen, setIsEditNoteOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [isGraphViewerOpen, setIsGraphViewerOpen] = useState(false);
  const [graphViewerDot, setGraphViewerDot] = useState("");
  // Traccia se il contenuto supera la soglia di altezza
  const [isTall, setIsTall] = useState(false);
  const contentMeasureRef = useRef(null);

  // Misura l'altezza reale del contenuto dopo ogni render del contenuto
  useLayoutEffect(() => {
    const el = contentMeasureRef.current;
    if (!el) return;
    const tall = el.scrollHeight > NOTE_MAX_HEIGHT;
    setIsTall((prev) => (prev !== tall ? tall : prev));
  }, [content, contentType]);
  // Menu aggiuntivo per il box nota
  const noteMenuItems = [
    {
      label: "Modifica nota",
      icon: <PencilIcon className="w-5 h-5" />,
      onClick: () => setIsEditNoteOpen(true),
    },
  ];

  // Gestione salvataggio nota
  const handleNoteConfirm = async (newContent, newContentType) => {
    if (onContentChange) {
      await onContentChange(newContent, newContentType);
    }
    setIsEditNoteOpen(false);
  };

  // Se non c'è contenuto, mostra il tasto per aggiungerlo
  const hasContent = content && content.trim().length > 0;

  return (
    <>
      <BaseBentoBox
        title={title}
        isPinned={isPinned}
        createdByName={createdByName}
        createdAt={createdAt}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        onSendMessageFromBox={onSendMessageFromBox}
        menuItems={noteMenuItems}
        minHeight={hasContent ? undefined : 150}
      >
        {hasContent ? (
          // Riquadro contenente la nota — cliccabile per aprire il viewer
          <div className="flex flex-col gap-2">
            {/* Wrapper con altezza massima e troncamento quando non espanso */}
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              className="
                w-full text-left bg-bg-tertiary/50 border border-border/50 rounded-lg p-3
                hover:border-primary/40 hover:bg-bg-tertiary
                transition-colors duration-150
                cursor-pointer
              "
              aria-label="Visualizza nota"
            >
              {/* Contenitore con clip quando non espanso */}
              <div
                ref={contentMeasureRef}
                className={`note-box-content${isTall ? " tall" : ""}${isNoteExpanded ? " expanded" : ""}`}
              >
                {contentType === "markdown" ? (
                  <MarkdownRenderer
                    content={content}
                    className="note-markdown text-sm pointer-events-none"
                    onGraphPreviewClick={(dot) => {
                      setGraphViewerDot(dot);
                      setIsGraphViewerOpen(true);
                    }}
                  />
                ) : (
                  <div
                    className="text-sm text-text-secondary leading-relaxed pointer-events-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                    style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
                  />
                )}
              </div>
            </button>

            {/* Bottone espandi/contrai — visibile solo se il contenuto supera la soglia */}
            {isTall && (
              <button
                type="button"
                onClick={() => setIsNoteExpanded((v) => !v)}
                className="
                  w-full py-2 px-3
                  border-2 border-dashed border-border/50 rounded-lg
                  flex items-center justify-center gap-2
                  text-text-secondary hover:text-primary
                  hover:border-primary/50
                  transition-colors duration-150
                "
                aria-label={isNoteExpanded ? "Contrai nota" : "Espandi nota"}
              >
                <span className="text-xs font-medium">
                  {isNoteExpanded ? "Contrai" : "Espandi"}
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-150 ease-out ${
                    isNoteExpanded ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>
            )}
          </div>
        ) : (
          // Stato vuoto - uniforme
          <button
            onClick={() => setIsEditNoteOpen(true)}
            className="
              w-full py-6
              flex flex-col items-center justify-center gap-3
              text-text-muted
              hover:text-primary
              transition-colors duration-200
              group
            "
          >
            <div className="w-14 h-14 rounded-full bg-bg-tertiary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <FileTextIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Scrivi una nota</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per iniziare
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale modifica nota con editor rich text */}
      <RichTextModal
        isOpen={isEditNoteOpen}
        onClose={() => setIsEditNoteOpen(false)}
        onConfirm={handleNoteConfirm}
        initialContent={content}
        contentType={contentType}
        noteTitle={title}
      />

      {/* Modale visualizzatore nota (sola lettura, larghezza 3 bento box) */}
      <NoteViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={title}
        content={content}
        contentType={contentType}
      />

      {/* Modale visualizzatore grafico singolo (aperto dai placeholder in preview) */}
      <GraphViewerModal
        isOpen={isGraphViewerOpen}
        onClose={() => setIsGraphViewerOpen(false)}
        dot={graphViewerDot}
      />
    </>
  );
};

export default NoteBox;
