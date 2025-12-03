import { useState, useEffect, useCallback } from "react";
import { User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { MODAL_PROFILE } from "../App";
import {
  GroupCard,
  CreateGroupButton,
  JoinGroupButton,
  EmptyGroupsCard,
} from "../components/groups";
import { InputModal } from "../components/modal";
import { Spinner } from "../components/ui";
import { getUserGroups, createGroup, joinGroup } from "../services/groups";
import { validateGroupName, validateGroupCode } from "../utils/groupValidation";

const Dashboard = () => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const displayName = user?.displayName || "Utente";

  // Stati per i gruppi
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Carica i gruppi dell'utente
  const loadGroups = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error("Errore caricamento gruppi:", error);
    } finally {
      setLoadingGroups(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Crea un nuovo gruppo
  const handleCreateGroup = async (name) => {
    setIsCreating(true);
    try {
      const newGroup = await createGroup(name, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      setGroups((prev) => [newGroup, ...prev]);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Errore creazione gruppo:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Unisciti a un gruppo
  const handleJoinGroup = async (code) => {
    setIsJoining(true);
    setJoinError("");
    try {
      const group = await joinGroup(code, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      setGroups((prev) => [group, ...prev]);
      setIsJoinModalOpen(false);
    } catch (error) {
      setJoinError(error.message);
      throw error; // Per non chiudere il modale
    } finally {
      setIsJoining(false);
    }
  };

  // Aggiorna un gruppo nella lista
  const handleGroupUpdated = (updatedGroup) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
  };

  // Rimuovi un gruppo dalla lista (uscita o eliminazione)
  const handleGroupLeft = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  // Validazione codice con errore server
  const validateJoinCode = (code) => {
    const validationError = validateGroupCode(code);
    if (validationError) return validationError;
    if (joinError) return joinError;
    return null;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg-primary">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-bg-secondary border-b border-border sticky top-0 z-50">
        {/* Logo - Left */}
        <span className="text-lg font-bold text-primary">Scaletta</span>

        {/* Profile Button - Right (tondo) */}
        <button
          onClick={() => openModal(MODAL_PROFILE)}
          className="flex items-center justify-center w-10 h-10 text-text-secondary bg-bg-tertiary rounded-full hover:bg-divider hover:text-text-primary transition-colors"
          aria-label="Apri profilo"
        >
          <User className="w-5 h-5" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 p-5">
        <div className="max-w-2xl mx-auto">
          {/* Lista gruppi */}
          <div className="space-y-3">
            {loadingGroups ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : groups.length === 0 ? (
              <EmptyGroupsCard
                onCreateGroup={() => setIsCreateModalOpen(true)}
                onJoinGroup={() => setIsJoinModalOpen(true)}
              />
            ) : (
              <>
                {groups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    currentUserId={user?.uid}
                    onGroupUpdated={handleGroupUpdated}
                    onGroupLeft={handleGroupLeft}
                  />
                ))}

                {/* Sezione tasti crea/unisciti - solo quando ci sono gruppi */}
                <div className="flex gap-3 mt-1">
                  <CreateGroupButton
                    onClick={() => setIsCreateModalOpen(true)}
                  />
                  <JoinGroupButton onClick={() => setIsJoinModalOpen(true)} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modale crea gruppo */}
      <InputModal
        isOpen={isCreateModalOpen}
        title="Crea nuovo gruppo"
        label="Nome gruppo"
        placeholder="Inserisci il nome del gruppo"
        initialValue=""
        confirmText="Crea"
        onConfirm={handleCreateGroup}
        onClose={() => setIsCreateModalOpen(false)}
        validate={validateGroupName}
        loading={isCreating}
        zIndex={1000}
      />

      {/* Modale unisciti a gruppo */}
      <InputModal
        isOpen={isJoinModalOpen}
        title="Unisciti a un gruppo"
        label="Codice gruppo"
        placeholder="Inserisci il codice di 8 caratteri"
        initialValue=""
        confirmText="Unisciti"
        onConfirm={(code) => handleJoinGroup(code.toUpperCase())}
        onClose={() => {
          setIsJoinModalOpen(false);
          setJoinError("");
        }}
        validate={validateJoinCode}
        loading={isJoining}
        zIndex={1000}
        exactLength={8}
      />
    </div>
  );
};

export default Dashboard;
