import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { Modal, InputModal } from "../modal";
import InfoBox from "../ui/InfoBox";
import EditableInfoBox from "../ui/EditableInfoBox";
import CopyableInfoBox from "../ui/CopyableInfoBox";
import MemberPillList from "../ui/MemberPillList";
import DangerButton from "../ui/DangerButton";
import Divider from "../ui/Divider";
import {
  updateGroupName,
  leaveGroup,
  deleteGroup,
} from "../../services/groups";
import { validateGroupName } from "../../utils/groupValidation";

/**
 * GroupInfoModal - Modale informazioni gruppo
 * Stile simile al ProfileModal
 */
const GroupInfoModal = ({
  isOpen,
  group,
  currentUserId,
  isFounder,
  onClose,
  onGroupUpdated,
  onGroupLeft,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!group) return null;

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async (newName) => {
    setIsUpdating(true);
    try {
      await updateGroupName(group.id, newName);
      if (onGroupUpdated) {
        onGroupUpdated({ ...group, name: newName.trim() });
      }
      setIsEditingName(false);
    } catch (error) {
      console.error("Errore aggiornamento nome gruppo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(group.id, { uid: currentUserId });
      if (onGroupLeft) {
        onGroupLeft(group.id);
      }
    } catch (error) {
      console.error("Errore uscita dal gruppo:", error);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await deleteGroup(group.id, currentUserId);
      if (onGroupLeft) {
        onGroupLeft(group.id);
      }
    } catch (error) {
      console.error("Errore eliminazione gruppo:", error);
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
      {/* Modale principale info gruppo */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Info Gruppo"
        variant="info"
        zIndex={isEditingName ? 990 : 1000}
      >
        <div
          className={`flex flex-col gap-4 transition-all duration-200 ${
            isEditingName ? "blur-sm pointer-events-none" : ""
          }`}
        >
          {/* Nome gruppo - modificabile */}
          <EditableInfoBox
            title="Nome gruppo"
            value={group.name}
            color="purple"
            onEdit={handleEditName}
          />

          {/* Codice gruppo - copiabile */}
          <CopyableInfoBox
            title="Codice gruppo"
            value={group.code}
            color="blue"
          />

          {/* Data creazione */}
          <InfoBox title="Data creazione" color="gray">
            <span className="text-sm">{formatDate(group.createdAt)}</span>
          </InfoBox>

          {/* Membri */}
          <InfoBox
            title="Membri"
            titleExtra={`(${group.members?.length || 0})`}
            color="teal"
          >
            <MemberPillList
              members={group.members}
              currentUserId={currentUserId}
              founderId={group.founderId}
              color="teal"
            />
          </InfoBox>

          {/* Divisore */}
          <Divider spacing="sm" />

          {/* Tasto esci/elimina gruppo */}
          <div className="pt-0">
            {isFounder ? (
              <DangerButton
                confirmTitle="Elimina gruppo"
                confirmMessage={`Sei sicuro di voler eliminare "${group.name}"? Questa azione non può essere annullata e tutti i membri perderanno l'accesso.`}
                confirmText="Elimina"
                onConfirm={handleDeleteGroup}
                zIndex={1010}
              >
                <Trash2 className="w-5 h-5" />
                Elimina gruppo
              </DangerButton>
            ) : (
              <DangerButton
                confirmTitle="Esci dal gruppo"
                confirmMessage={`Sei sicuro di voler uscire da "${group.name}"? Potrai rientrare solo con un nuovo invito.`}
                confirmText="Esci"
                onConfirm={handleLeaveGroup}
                zIndex={1010}
              >
                <LogOut className="w-5 h-5" />
                Esci dal gruppo
              </DangerButton>
            )}
          </div>
        </div>
      </Modal>

      {/* Modale modifica nome - sopra al modale info */}
      <InputModal
        isOpen={isEditingName}
        title="Modifica nome gruppo"
        label="Nuovo nome"
        placeholder="Inserisci il nuovo nome"
        initialValue={group.name || ""}
        confirmText="Salva"
        onConfirm={handleSaveName}
        onClose={() => setIsEditingName(false)}
        validate={validateGroupName}
        loading={isUpdating}
        zIndex={1010}
      />
    </>
  );
};

export default GroupInfoModal;
