import { useState, useEffect } from "react";
import { Modal } from "../modal";
import { CheckIcon, TagIcon } from "../icons";

/**
 * BoxTagModal - Modale per selezionare uno o più box da taggare
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {Array} boxes - Array di box disponibili [{ id, title, boxType }]
 * @param {Array} initialSelectedBoxIds - Array di box ID già selezionati (opzionale)
 * @param {function} onConfirm - Callback conferma con array di box selezionati
 * @param {function} onClose - Callback chiusura
 * @param {boolean} loading - Se sta caricando
 * @param {number} zIndex - z-index personalizzato per modali annidati
 */
const BoxTagModal = ({
  isOpen,
  boxes = [],
  initialSelectedBoxIds = [],
  onConfirm,
  onClose,
  loading = false,
  zIndex,
}) => {
  const [selectedBoxIds, setSelectedBoxIds] = useState([]);
  const [wasOpen, setWasOpen] = useState(false);

  // Reset selection quando il modale si apre (da chiuso ad aperto)
  useEffect(() => {
    if (isOpen && !wasOpen) {
      // Il modale si sta aprendo
      setSelectedBoxIds(initialSelectedBoxIds);
    }
    setWasOpen(isOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, wasOpen]);

  const handleToggleBox = (boxId) => {
    setSelectedBoxIds((prev) => {
      if (prev.includes(boxId)) {
        return prev.filter((id) => id !== boxId);
      } else {
        return [...prev, boxId];
      }
    });
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      // Restituisci id, boxType E title (per mantenere il nome se il box viene eliminato)
      const selectedBoxes = boxes
        .filter((box) => selectedBoxIds.includes(box.id))
        .map((box) => ({ id: box.id, boxType: box.boxType, title: box.title }));
      await onConfirm(selectedBoxes);
    }
  };

  const isDisabled = loading || selectedBoxIds.length === 0;

  // Ottieni l'icona per il tipo di box
  const getBoxTypeLabel = (boxType) => {
    const labels = {
      note: "📝 Nota",
      photo: "📷 Foto",
      pdf: "📄 PDF",
      file: "📎 File",
      checklist: "✓ Checklist",
      anagrafica: "👤 Anagrafica",
      version: "🔢 Versioni",
    };
    return labels[boxType] || "📦 Box";
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Seleziona box da taggare"
      confirmText={`Tagga ${selectedBoxIds.length > 0 ? `(${selectedBoxIds.length})` : ""}`}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={isDisabled}
      isLoading={loading}
      zIndex={zIndex}
    >
      <div className="py-2">
        {boxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mb-3">
              <TagIcon className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-sm text-text-muted">
              Nessun box disponibile nel progetto
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {boxes.map((box) => {
              const isSelected = selectedBoxIds.includes(box.id);
              return (
                <button
                  key={box.id}
                  onClick={() => handleToggleBox(box.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl 
                    transition-all duration-150
                    ${
                      isSelected
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-bg-tertiary border-2 border-transparent hover:bg-divider"
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
                      transition-all duration-150
                      ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-border bg-bg-secondary"
                      }
                    `}
                  >
                    {isSelected && (
                      <CheckIcon className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>

                  {/* Box info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {box.title}
                    </div>
                    <div className="text-xs text-text-muted">
                      {getBoxTypeLabel(box.boxType)}
                    </div>
                  </div>

                  {/* Tag icon per box selezionati */}
                  {isSelected && (
                    <TagIcon className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Hint */}
        {boxes.length > 0 && (
          <p className="text-xs text-text-muted text-center mt-3">
            Seleziona uno o più box per taggarli nel messaggio
          </p>
        )}
      </div>
    </Modal>
  );
};

export default BoxTagModal;
