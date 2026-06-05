import Modal from "./Modal";
import renderMarkdown from "../../utils/markdownRenderer";

/**
 * NoteViewerModal - Visualizzatore nota a lettura
 *
 * Apre la nota in una overlay di larghezza pari a 3 bento box affiancati
 * (3 × 320px + 2 × 16px gap = 992px) per una lettura comoda.
 * Supporta sia il rendering HTML (modalità TXT) sia Markdown.
 *
 * @param {boolean}  isOpen      - Stato apertura modale
 * @param {function} onClose     - Callback chiusura
 * @param {string}   title       - Titolo della nota (dal box)
 * @param {string}   content     - Contenuto della nota
 * @param {string}   contentType - Tipo: "txt" | "markdown" (default "txt")
 */
const NoteViewerModal = ({
  isOpen,
  onClose,
  title,
  content,
  contentType = "txt",
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Nota"}
      variant="info"
      maxWidth="max-w-[992px]"
    >
      {contentType === "markdown" ? (
        <div
          className="note-markdown text-sm"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "") }}
        />
      ) : (
        <div
          className="text-sm text-text-primary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content || "" }}
          style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
        />
      )}
    </Modal>
  );
};

export default NoteViewerModal;
