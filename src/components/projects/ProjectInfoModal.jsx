import { useState, useCallback } from "react";
import { Modal, InputModal } from "../modal";
import InfoBox from "../ui/InfoBox";
import EditableInfoBox from "../ui/EditableInfoBox";
import ProjectColorPicker from "../ui/ProjectColorPicker";
import { validateProjectName } from "../../utils/projectValidation";
import { projectNameExists } from "../../services/projects";

/**
 * ProjectInfoModal - Modale informazioni progetto
 * Stile simile a ProfileModal
 * Nota: L'eliminazione è stata spostata nel menu kebab (solo per progetti cestinati)
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {object} project - Dati del progetto
 * @param {function} onClose - Callback chiusura
 * @param {function} onUpdateName - Callback per aggiornare il nome
 * @param {function} onUpdateColor - Callback per aggiornare il colore
 */
const ProjectInfoModal = ({
  isOpen,
  project,
  onClose,
  onUpdateName,
  onUpdateColor,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Validazione nome progetto con controllo duplicati
  const validateProjectNameWithDuplicate = useCallback(
    async (name) => {
      // Prima valida il formato del nome
      const formatError = validateProjectName(name);
      if (formatError) return formatError;

      // Poi controlla se esiste già un progetto con lo stesso nome (escludendo quello corrente)
      if (project?.groupId) {
        const exists = await projectNameExists(
          project.groupId,
          name,
          project.id
        );
        if (exists) {
          return "Esiste già un progetto con questo nome nel gruppo";
        }
      }

      return null;
    },
    [project?.groupId, project?.id]
  );

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

          {/* Creato da */}
          <InfoBox title="Creato da" color="blue">
            <span className="text-sm">{project.createdByName || "N/D"}</span>
          </InfoBox>

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
        validate={validateProjectNameWithDuplicate}
        loading={isUpdating}
        zIndex={1010}
      />
    </>
  );
};

export default ProjectInfoModal;
