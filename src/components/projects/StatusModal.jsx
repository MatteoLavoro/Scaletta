import { useState } from "react";
import { TrashIcon } from "../icons";
import { Modal, ConfirmModal } from "../modal";
import { StatusSlider, Divider } from "../ui";
import { DEFAULT_PROJECT_STATUS } from "../../utils/projectStatuses";

/**
 * StatusModal - Modale per gestire lo stato di un progetto
 * Contiene uno slider per cambiare stato e un tasto elimina
 * Chiusura ottimizzata: si chiude subito e aggiorna in background
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {object} project - Dati del progetto
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @param {string} currentUserId - ID dell'utente corrente
 * @param {function} onClose - Callback chiusura
 * @param {function} onStatusChange - Callback per aggiornare lo stato (eseguito in background)
 * @param {function} onDelete - Callback per eliminare il progetto
 */
const StatusModal = ({
  isOpen,
  project,
  isFounder,
  currentUserId,
  onClose,
  onStatusChange,
  onDelete,
}) => {
  // Stato locale ottimistico
  const projectStatus = project?.status || DEFAULT_PROJECT_STATUS;
  const [localStatus, setLocalStatus] = useState(projectStatus);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lastProjectStatus, setLastProjectStatus] = useState(projectStatus);
  const [wasOpen, setWasOpen] = useState(false);

  // Rileva quando il progetto cambia e resetta lo stato locale
  if (projectStatus !== lastProjectStatus) {
    setLocalStatus(projectStatus);
    setLastProjectStatus(projectStatus);
  }

  // Resetta quando il modale si riapre (da chiuso a aperto)
  if (isOpen && !wasOpen) {
    setLocalStatus(projectStatus);
    setWasOpen(true);
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  // Calcola se ci sono cambiamenti
  const hasChanges = localStatus !== projectStatus;

  // Handler per cambio stato locale
  const handleLocalStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
  };

  // Handler per chiusura - chiude subito e salva in background
  const handleClose = () => {
    // Chiudi immediatamente il modale
    onClose();

    // Salva le modifiche in background (senza await)
    if (hasChanges && onStatusChange) {
      onStatusChange(localStatus).catch((error) => {
        console.error("Errore aggiornamento stato:", error);
      });
    }
  };

  // Handler per eliminazione
  const handleDeleteConfirm = async () => {
    setIsDeleteConfirmOpen(false);
    if (onDelete) {
      await onDelete();
    }
  };

  // Il tasto elimina è attivo solo se lo stato è "cestinato"
  const canDelete = localStatus === "cestinato";

  // Può eliminare: founder del gruppo O creatore del progetto
  const isProjectCreator =
    currentUserId && project?.createdBy === currentUserId;
  const canShowDeleteSection = isFounder || isProjectCreator;

  if (!project) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Stato progetto"
        variant="info"
        zIndex={isDeleteConfirmOpen ? 990 : 1000}
      >
        <div
          className={`flex flex-col gap-5 transition-all duration-200 ${
            isDeleteConfirmOpen ? "blur-sm pointer-events-none" : ""
          }`}
        >
          {/* Slider stati in riquadro */}
          <div className="bg-bg-tertiary border border-border rounded-xl p-4">
            <StatusSlider
              value={localStatus}
              onChange={handleLocalStatusChange}
            />
          </div>

          {/* Separatore */}
          <Divider spacing="sm" />

          {/* Sezione eliminazione */}
          <div className="space-y-3">
            {canShowDeleteSection ? (
              <>
                <p className="text-xs text-text-muted text-center">
                  {canDelete
                    ? "Il progetto è nel cestino. Puoi eliminarlo definitivamente."
                    : "Sposta il progetto nel cestino per poterlo eliminare."}
                </p>
                <button
                  type="button"
                  onClick={() => canDelete && setIsDeleteConfirmOpen(true)}
                  disabled={!canDelete}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3
                    rounded-xl font-medium text-sm
                    transition-all duration-200
                    ${
                      canDelete
                        ? "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25 active:scale-[0.98]"
                        : "bg-bg-tertiary text-text-muted border border-border cursor-not-allowed opacity-60"
                    }
                  `}
                >
                  <TrashIcon className="w-5 h-5" />
                  Elimina definitivamente
                </button>
              </>
            ) : (
              <p className="text-xs text-text-muted text-center py-2">
                Solo il creatore del gruppo o del progetto può eliminare i
                progetti.
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Modale conferma eliminazione */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="Elimina definitivamente"
        message={`Sei sicuro di voler eliminare definitivamente "${project.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        isDanger
        zIndex={1010}
      />
    </>
  );
};

export default StatusModal;
