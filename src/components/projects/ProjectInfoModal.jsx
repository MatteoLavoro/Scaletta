import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Modal, InputModal } from "../modal";
import InfoBox from "../ui/InfoBox";
import EditableInfoBox from "../ui/EditableInfoBox";
import ProjectColorPicker from "../ui/ProjectColorPicker";
import DangerButton from "../ui/DangerButton";
import Divider from "../ui/Divider";
import { validateProjectName } from "../../utils/projectValidation";

/**
 * ProjectInfoModal - Modale informazioni progetto
 * Stile simile a ProfileModal
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {object} project - Dati del progetto
 * @param {boolean} isFounder - Se l'utente è il founder del gruppo
 * @param {function} onClose - Callback chiusura
 * @param {function} onUpdateName - Callback per aggiornare il nome
 * @param {function} onUpdateColor - Callback per aggiornare il colore
 * @param {function} onDelete - Callback per eliminare il progetto
 */
const ProjectInfoModal = ({
  isOpen,
  project,
  isFounder,
  onClose,
  onUpdateName,
  onUpdateColor,
  onDelete,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!project) return null;

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async (newName) => {
    setIsUpdating(true);
    try {
      if (onUpdateName) {
        await onUpdateName(newName.trim());
      }
      setIsEditingName(false);
    } catch (error) {
      console.error("Errore aggiornamento nome progetto:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleColorChange = async (newColor) => {
    try {
      if (onUpdateColor) {
        await onUpdateColor(newColor);
      }
    } catch (error) {
      console.error("Errore aggiornamento colore progetto:", error);
    }
  };

  const handleDeleteProject = async () => {
    try {
      if (onDelete) {
        await onDelete();
      }
    } catch (error) {
      console.error("Errore eliminazione progetto:", error);
    }
  };

  // Formatta la data di creazione
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/D";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Modale principale info progetto */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Info Progetto"
        variant="info"
        zIndex={isEditingName ? 990 : 1000}
      >
        <div
          className={`flex flex-col gap-4 transition-all duration-200 ${
            isEditingName ? "blur-sm pointer-events-none" : ""
          }`}
        >
          {/* Nome progetto - modificabile */}
          <EditableInfoBox
            title="Nome progetto"
            value={project.name}
            color="purple"
            onEdit={handleEditName}
          />

          {/* Data creazione */}
          <InfoBox title="Data creazione" color="gray">
            <span className="text-sm">{formatDate(project.createdAt)}</span>
          </InfoBox>

          {/* Colore progetto */}
          <InfoBox title="Colore progetto" color="teal">
            <ProjectColorPicker
              value={project.color || "blue"}
              onChange={handleColorChange}
            />
          </InfoBox>

          {/* Tasto elimina progetto - solo per il founder */}
          {isFounder && (
            <>
              <Divider spacing="sm" />
              <div className="pt-0">
                <DangerButton
                  confirmTitle="Elimina progetto"
                  confirmMessage={`Sei sicuro di voler eliminare "${project.name}"? Questa azione non può essere annullata.`}
                  confirmText="Elimina"
                  onConfirm={handleDeleteProject}
                  zIndex={1010}
                >
                  <Trash2 className="w-5 h-5" />
                  Elimina progetto
                </DangerButton>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modale modifica nome - sopra al modale info */}
      <InputModal
        isOpen={isEditingName}
        title="Modifica nome progetto"
        label="Nuovo nome"
        placeholder="Inserisci il nuovo nome"
        initialValue={project.name || ""}
        confirmText="Salva"
        onConfirm={handleSaveName}
        onClose={() => setIsEditingName(false)}
        validate={validateProjectName}
        loading={isUpdating}
        zIndex={1010}
      />
    </>
  );
};

export default ProjectInfoModal;
