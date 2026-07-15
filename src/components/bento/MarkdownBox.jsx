import { useState, useMemo } from "react";
import { PencilIcon, CodeIcon } from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { RichTextModal, NoteViewerModal } from "../modal";
import MarkdownRenderer from "../ui/MarkdownRenderer";

// Numero massimo di righe Markdown da renderizzare nell'anteprima del box.
// Le righe successive NON vengono mai processate dal parser/renderer,
// azzerando il costo di parsing per documenti lunghi nel box.
const PREVIEW_LINE_LIMIT = 20;

// Altezza massima (px) del blocco anteprima.
// Metà dell'altezza massima di NoteBox (640 / 2 = 320 px).
const PREVIEW_MAX_HEIGHT = 320;

/**
 * MarkdownBox - Bento Box per le note in formato Markdown
 *
 * Box specializzato per contenere testo scritto in Markdown con rendering
 * completo (titoli, grassetto, corsivo, codice, grafici Graphviz, ecc.).
 * Solo modalità Markdown — per note semplici usare NoteBox.
 *
 * Anteprima ottimizzata per le performance:
 *  - Renderizza SOLO le prime PREVIEW_LINE_LIMIT righe; il resto del documento
 *    non viene mai passato al parser → nessun costo per contenuti non visibili.
 *  - Altezza fissa a PREVIEW_MAX_HEIGHT px con overflow hidden e gradiente di fade.
 *  - Nessun pulsante "Espandi" — click sul box → viewer modale (contenuto completo).
 *
 * @param {string}   title                - Titolo del box
 * @param {string}   content              - Contenuto Markdown della nota
 * @param {boolean}  isPinned             - Se il box è fissato in alto
 * @param {string}   createdByName        - Nome utente che ha creato il box
 * @param {Date|Timestamp} createdAt      - Data creazione box
 * @param {function} onPinToggle          - Callback quando si clicca sul pin
 * @param {function} onTitleChange        - Callback per cambiare il titolo
 * @param {function} onContentChange      - Callback per cambiare il contenuto
 * @param {function} onDelete             - Callback per eliminare il box
 * @param {function} onSendMessageFromBox - Callback per inviare messaggio taggando questo box
 */
const MarkdownBox = ({
  title = "Markdown",
  content = "",
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

  // Pre-tronca il markdown per il box anteprima.
  // Solo le prime PREVIEW_LINE_LIMIT righe vengono passate al renderer:
  // il resto del documento non viene mai analizzato/renderizzato nel box.
  // Il contenuto completo viene usato esclusivamente nel viewer modale.
  const { previewContent, isTruncated } = useMemo(() => {
    if (!content) return { previewContent: "", isTruncated: false };
    const lines = content.split("\n");
    if (lines.length <= PREVIEW_LINE_LIMIT) {
      return { previewContent: content, isTruncated: false };
    }
    return {
      previewContent: lines.slice(0, PREVIEW_LINE_LIMIT).join("\n"),
      isTruncated: true,
    };
  }, [content]);

  // Menu aggiuntivo per il box markdown
  const markdownMenuItems = [
    {
      label: "Modifica markdown",
      icon: <PencilIcon className="w-5 h-5" />,
      onClick: () => setIsEditNoteOpen(true),
    },
  ];

  // Gestione salvataggio contenuto
  const handleNoteConfirm = async (newContent, newContentType) => {
    if (onContentChange) {
      await onContentChange(newContent, newContentType);
    }
    setIsEditNoteOpen(false);
  };

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
        menuItems={markdownMenuItems}
        minHeight={hasContent ? undefined : 150}
      >
        {hasContent ? (
          // Riquadro anteprima — cliccabile per aprire il viewer con il contenuto completo
          <button
            type="button"
            onClick={() => setIsViewerOpen(true)}
            className="
              w-full text-left bg-bg-tertiary/50 border border-border/50 rounded-lg p-3
              hover:border-primary/40 hover:bg-bg-tertiary
              transition-colors duration-150
              cursor-pointer
            "
            aria-label="Visualizza markdown"
          >
            {/*
             * Anteprima con altezza fissa e overflow hidden.
             * Il gradiente di fade viene mostrato solo quando il contenuto
             * è stato troncato (ci sono righe non visibili nel viewer).
             */}
            <div
              style={{
                maxHeight: `${PREVIEW_MAX_HEIGHT}px`,
                overflow: "hidden",
                ...(isTruncated && {
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, black calc(100% - 48px), transparent 100%)",
                }),
              }}
            >
              <MarkdownRenderer
                content={previewContent}
                className="note-markdown text-sm pointer-events-none"
              />
            </div>
          </button>
        ) : (
          // Stato vuoto
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
              <CodeIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Scrivi in Markdown</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per iniziare
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale editor — bloccato in modalità Markdown */}
      <RichTextModal
        isOpen={isEditNoteOpen}
        onClose={() => setIsEditNoteOpen(false)}
        onConfirm={handleNoteConfirm}
        initialContent={content}
        contentType="markdown"
        lockedMode="markdown"
        noteTitle={title}
      />

      {/* Viewer modale — mostra il contenuto COMPLETO con rendering Markdown pieno */}
      <NoteViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={title}
        content={content}
        contentType="markdown"
      />
    </>
  );
};

export default MarkdownBox;
