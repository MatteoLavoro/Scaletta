import { useState } from "react";
import { PencilIcon, FileTextIcon, PlusIcon } from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { InputModal } from "../modal";

/**
 * NoteBox - Bento Box per le note
 *
 * Box specializzato per contenere una nota di testo.
 * Si auto-dimensiona in base al contenuto.
 * Ha un kebab menu con l'opzione per modificare la nota.
 *
 * @param {string} title - Titolo del box
 * @param {string} content - Contenuto della nota
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onContentChange - Callback per cambiare il contenuto
 * @param {function} onDelete - Callback per eliminare il box
 */
const NoteBox = ({
  title = "Nota",
  content = "",
  onTitleChange,
  onContentChange,
  onDelete,
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

  // Validazione nota
  const validateNote = (value) => {
    if (value.length > 2000) return "La nota non può superare 2000 caratteri";
    return null;
  };

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
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={noteMenuItems}
        minHeight={hasContent ? undefined : 120}
      >
        {hasContent ? (
          // Mostra il contenuto della nota
          <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        ) : (
          // Mostra tasto per aggiungere la nota
          <button
            onClick={() => setIsEditNoteOpen(true)}
            className="
              w-full py-4
              flex flex-col items-center justify-center gap-2
              text-text-muted
              hover:text-primary
              transition-colors duration-200
            "
          >
            <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
              <PlusIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium">Aggiungi nota</span>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale modifica nota */}
      <InputModal
        isOpen={isEditNoteOpen}
        title={hasContent ? "Modifica nota" : "Nuova nota"}
        label="Contenuto"
        placeholder="Scrivi la tua nota..."
        initialValue={content}
        confirmText="Salva"
        onConfirm={handleNoteConfirm}
        onClose={() => setIsEditNoteOpen(false)}
        validate={validateNote}
        maxLength={2000}
        multiline
        rows={6}
        zIndex={1020}
      />
    </>
  );
};

export default NoteBox;
