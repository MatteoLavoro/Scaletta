import { useEffect } from "react";
import Modal from "./Modal";
import MarkdownRenderer from "../ui/MarkdownRenderer";

/**
 * GraphViewerModal - Visualizzatore grafico Graphviz
 *
 * Mostra un singolo grafico DOT in un overlay di lettura.
 * Stesso stile del NoteViewerModal, larghezza massima 992px.
 *
 * @param {boolean}  isOpen   - Stato apertura modale
 * @param {function} onClose  - Callback chiusura
 * @param {string}   dot      - Codice DOT del grafico da visualizzare
 * @param {string}   [title]  - Titolo del modale (default "Grafico")
 */
const GraphViewerModal = ({ isOpen, onClose, dot, title }) => {
  // Disabilita la selezione testo su tutto il documento tranne il contenuto del modale,
  // così il testo delle note in background non è selezionabile mentre il modale è aperto.
  useEffect(() => {
    if (isOpen) {
      document.body.style.userSelect = "none";
      return () => {
        document.body.style.userSelect = "";
      };
    }
  }, [isOpen]);

  // Avvolge il codice DOT in un blocco markdown fenced per riutilizzare
  // tutta l'infrastruttura di rendering MarkdownRenderer + Graphviz WASM.
  const markdownContent = dot ? `\`\`\`dot\n${dot}\n\`\`\`` : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Grafico"}
      variant="info"
      maxWidth="max-w-[992px]"
    >
      <MarkdownRenderer
        content={markdownContent}
        className="note-markdown text-sm"
        style={{ userSelect: "text" }}
        renderGraphviz
      />
    </Modal>
  );
};

export default GraphViewerModal;
