import { useState } from "react";
import { PencilIcon, FileTextIcon } from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { RichTextModal } from "../modal";

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

  // Menu aggiuntivo per il box nota
  const noteMenuItems = [
    {
      label: "Modifica nota",
      icon: <PencilIcon className="w-5 h-5" />,
      onClick: () => setIsEditNoteOpen(true),
    },
  ];

  // Gestione salvataggio nota
  const handleNoteConfirm = async (newContent) => {
    if (onContentChange) {
      await onContentChange(newContent);
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
          // Riquadro contenente la nota con HTML formattato
          <div className="bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
            <div
              className="text-sm text-text-secondary leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            />
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
      />
    </>
  );
};

export default NoteBox;
