import { useState } from "react";
import { LogOutIcon } from "../icons";
import { Modal, InputModal } from "../modal";
import InfoBox from "../ui/InfoBox";
import EditableInfoBox from "../ui/EditableInfoBox";
import ThemeSelector from "../ui/ThemeSelector";
import DangerButton from "../ui/DangerButton";
import Divider from "../ui/Divider";
import { useAuth } from "../../contexts/AuthContext";
import { logoutUser, updateUsername } from "../../services/auth";
import { validateUsername } from "../../utils/authValidation";

/**
 * ProfileModal - Modale profilo utente
 * Con InfoBox stilizzate per email, username (modificabile), tema/colore
 * DangerButton per logout
 */
const ProfileModal = ({ isOpen }) => {
  const { user, refreshUser } = useAuth();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleEditUsername = () => {
    setIsEditingUsername(true);
  };

  const handleSaveUsername = async (newUsername) => {
    setIsUpdating(true);
    try {
      await updateUsername(newUsername);
      if (refreshUser) refreshUser();
      // Chiude InputModal tornando al ProfileModal (non alla home)
      setIsEditingUsername(false);
    } catch (error) {
      console.error("Errore aggiornamento username:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const validateUsernameInput = (value) => {
    return validateUsername(value); // Ritorna null se valido, stringa errore se non valido
  };

  return (
    <>
      {/* Modale principale profilo - sfocato quando c'è modale annidato */}
      <Modal
        isOpen={isOpen}
        title="Profilo"
        variant="info"
        zIndex={isEditingUsername ? 990 : 1000}
      >
        <div
          className={`flex flex-col gap-4 transition-all duration-200 ${
            isEditingUsername ? "blur-sm pointer-events-none" : ""
          }`}
        >
          {/* Email */}
          <InfoBox title="Email" color="blue">
            <span className="text-sm sm:text-base break-all">
              {user?.email || "Non disponibile"}
            </span>
          </InfoBox>

          {/* Nome utente - modificabile */}
          <EditableInfoBox
            title="Nome utente"
            value={user?.displayName}
            color="purple"
            onEdit={handleEditUsername}
          />

          {/* Tema e colore */}
          <InfoBox title="Aspetto" color="teal">
            <ThemeSelector />
          </InfoBox>

          {/* Divisore */}
          <Divider spacing="sm" />

          {/* Tasto esci */}
          <div className="pt-0">
            <DangerButton
              confirmTitle="Esci dall'account"
              confirmMessage="Sei sicuro di voler uscire dal tuo account?"
              confirmText="Esci"
              onConfirm={handleLogout}
            >
              <LogOutIcon className="w-5 h-5" />
              Esci
            </DangerButton>
          </div>
        </div>
      </Modal>

      {/* Modale modifica username - sopra al profilo */}
      <InputModal
        isOpen={isEditingUsername}
        title="Modifica nome utente"
        label="Nuovo nome utente"
        placeholder="Inserisci il nuovo nome"
        initialValue={user?.displayName || ""}
        confirmText="Salva"
        onConfirm={handleSaveUsername}
        onClose={() => setIsEditingUsername(false)}
        validate={validateUsernameInput}
        loading={isUpdating}
        zIndex={1010}
      />
    </>
  );
};

export default ProfileModal;
