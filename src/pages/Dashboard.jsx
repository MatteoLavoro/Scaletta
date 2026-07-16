import { useState, useEffect } from "react";
import { UserIcon } from "../components/icons";
import { useAuth } from "../contexts/AuthContext";
import { useModal } from "../contexts/ModalContext";
import { MODAL_PROFILE } from "../App";
import {
  GroupCard,
  CreateGroupButton,
  JoinGroupButton,
  EmptyGroupsCard,
} from "../components/groups";
import { InputModal, SplitModalDemo } from "../components/modal";
import { Spinner } from "../components/ui";
import {
  getUserGroups,
  createGroup,
  joinGroup,
  subscribeToUserGroups,
} from "../services/groups";
import { validateGroupName, validateGroupCode } from "../utils/groupValidation";

const Dashboard = ({ onProjectClick, deletingProjectIds }) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  const displayName = user?.displayName || "Utente";

  // Oggetto utente corrente per passarlo ai componenti
  const currentUser = user
    ? {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      }
    : null;

  // Stati per i gruppi
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // Sottoscrizione real-time ai gruppi dell'utente
  useEffect(() => {
    if (!user?.uid) return;

    setLoadingGroups(true);

    // Usa onSnapshot per sincronizzazione in tempo reale
    const unsubscribe = subscribeToUserGroups(user.uid, (userGroups) => {
      setGroups(userGroups);
      setLoadingGroups(false);
    });

    // Cleanup: annulla la sottoscrizione quando il componente si smonta
    return () => unsubscribe();
  }, [user?.uid]);

  // Crea un nuovo gruppo
  const handleCreateGroup = async (name) => {
    setIsCreating(true);
    try {
      await createGroup(name, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      // Non serve setGroups - il listener real-time aggiornerà automaticamente
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
      await joinGroup(code, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
      });
      // Non serve setGroups - il listener real-time aggiornerà automaticamente
      setIsJoinModalOpen(false);
    } catch (error) {
      setJoinError(error.message);
      throw error; // Per non chiudere il modale
    } finally {
      setIsJoining(false);
    }
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
      <header
        className="flex items-center justify-between px-5 bg-bg-secondary border-b border-border sticky top-0 z-50"
        style={{
          paddingTop: "calc(1rem + var(--safe-area-inset-top))",
          paddingBottom: "1rem",
        }}
      >
        {/* Logo - Left */}
        <span className="text-lg font-bold text-primary">Scaletta</span>

        {/* Pulsanti destra: Demo + Profilo */}
        <div className="flex items-center gap-2">
          {/* Demo SplitModal */}
          <button
            onClick={() => setIsDemoOpen(true)}
            className="h-8 px-3 text-xs font-semibold text-text-secondary bg-bg-tertiary rounded-lg hover:bg-divider hover:text-text-primary border border-border/50 hover:border-border transition-colors"
            aria-label="Apri demo SplitModal"
          >
            Demo
          </button>

          {/* Profile Button */}
          <button
            onClick={() => openModal(MODAL_PROFILE)}
            className="flex items-center justify-center w-10 h-10 text-text-secondary bg-bg-tertiary rounded-full hover:bg-divider hover:text-text-primary transition-colors"
            aria-label="Apri profilo"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-5">
        <div className="max-w-2xl md:max-w-5xl mx-auto">
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
                    currentUser={currentUser}
                    onProjectClick={onProjectClick}
                    deletingProjectIds={deletingProjectIds}
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

      {/* Demo SplitModal */}
      <SplitModalDemo
        isOpen={isDemoOpen}
        onClose={() => setIsDemoOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
