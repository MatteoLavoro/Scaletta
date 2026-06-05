import Modal from "./Modal";

/**
 * NoteViewerModal - Visualizzatore nota a lettura
 *
 * Apre la nota in una overlay di larghezza pari a 3 bento box affiancati
 * (3 × 320px + 2 × 16px gap = 992px) per una lettura comoda.
 * Utilizza variant="info" per non mostrare il pulsante di conferma.
 *
 * @param {boolean} isOpen - Stato apertura modale
 * @param {function} onClose - Callback chiusura
 * @param {string} title - Titolo della nota (dal box)
 * @param {string} content - Contenuto HTML della nota
 */
const NoteViewerModal = ({ isOpen, onClose, title, content }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Nota"}
      variant="info"
      maxWidth="max-w-[992px]"
    >
      <div
        className="text-sm text-text-primary leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: content || "" }}
        style={{
          wordWrap: "break-word",
          whiteSpace: "pre-wrap",
        }}
      />
    </Modal>
  );
};

export default NoteViewerModal;
