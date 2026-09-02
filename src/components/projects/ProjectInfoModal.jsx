import { useState, useCallback, useEffect } from "react";
import { Modal, InputModal } from "../modal";
import InfoBox from "../ui/InfoBox";
import EditableInfoBox from "../ui/EditableInfoBox";
import CopyableInfoBox from "../ui/CopyableInfoBox";
import ProjectColorPicker from "../ui/ProjectColorPicker";
import { validateProjectName } from "../../utils/projectValidation";
import {
  projectNameExists,
  ensureProjectShareCode,
} from "../../services/projects";

/**
 * ProjectInfoModal - Modale informazioni progetto
 *
 * @param {boolean} isOpen
 * @param {object} project
 * @param {function} onClose
 * @param {function} onUpdateName
 * @param {function} onUpdateColor
 * @param {boolean} isOwner - Se l'utente è nel gruppo originale
 */
const ProjectInfoModal = ({
  isOpen,
  project,
  onClose,
  onUpdateName,
  onUpdateColor,
  isOwner = true,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shareCode, setShareCode] = useState(project?.shareCode || null);
  const [loadingCode, setLoadingCode] = useState(false);

  // Genera shareCode in modo lazy se mancante (solo per owner)
  useEffect(() => {
    if (!isOpen || !project?.id || !isOwner) return;
    if (project.shareCode) {
      setShareCode(project.shareCode);
      return;
    }
    if (shareCode) return;
    setLoadingCode(true);
    ensureProjectShareCode(project.id)
      .then((code) => setShareCode(code))
      .catch(console.error)
      .finally(() => setLoadingCode(false));
  }, [isOpen, project?.id, project?.shareCode, isOwner, shareCode]);

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
          project.id,
        );
        if (exists) {
          return "Esiste già un progetto con questo nome nel gruppo";
        }
      }

      return null;
    },
    [project?.groupId, project?.id],
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

          {/* Codice condivisione - solo per owner */}
          {isOwner && (
            <div className="flex flex-col gap-1.5">
              {loadingCode ? (
                <InfoBox title="Codice condivisione" color="indigo">
                  <span className="text-xs text-text-secondary">
                    Generazione in corso...
                  </span>
                </InfoBox>
              ) : (
                <CopyableInfoBox
                  title="Codice condivisione"
                  value={shareCode || ""}
                  color="purple"
                />
              )}
              <p className="text-xs text-text-secondary text-center px-1">
                Condividendo questo codice dai accesso al progetto ad altri
                gruppi
              </p>
            </div>
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
        validate={validateProjectNameWithDuplicate}
        loading={isUpdating}
        zIndex={1010}
      />
    </>
  );
};

export default ProjectInfoModal;
