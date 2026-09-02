import { useState, useEffect, useCallback } from "react";
import ProjectCard from "./ProjectCard";
import CreateProjectButton from "./CreateProjectButton";
import JoinSharedProjectButton from "./JoinSharedProjectButton";
import { InputModal } from "../modal";
import { Spinner } from "../ui";
import {
  createProject,
  subscribeToGroupProjects,
  projectNameExists,
  getProjectByShareCode,
  requestJoinSharedProject,
} from "../../services/projects";
import { validateProjectName } from "../../utils/projectValidation";

/**
 * ProjectGrid - Griglia di progetti con 3 colonne su mobile
 *
 * @param {string} groupId - ID del gruppo
 * @param {object} group - Oggetto gruppo completo (per founder check)
 * @param {object} currentUser - Utente corrente { uid, displayName, email }
 * @param {function} onProjectClick - Callback quando un progetto viene cliccato (riceve { project, group })
 * @param {function} onProjectCountChange - Callback quando cambia il numero di progetti (riceve il count totale)
 * @param {Set} deletingProjectIds - Set di ID progetti in eliminazione (per UI ottimistica)
 */
const ProjectGrid = ({
  groupId,
  group,
  currentUser,
  onProjectClick,
  onProjectCountChange,
  deletingProjectIds = new Set(),
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Sottoscrizione real-time ai progetti del gruppo
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = subscribeToGroupProjects(groupId, (groupProjects) => {
      setProjects(groupProjects);
      // Aggiorna il contatore progetti con il count totale
      onProjectCountChange?.(groupProjects.length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, onProjectCountChange]);

  // Validazione nome progetto con controllo duplicati
  const validateProjectNameWithDuplicate = useCallback(
    async (name) => {
      // Prima valida il formato del nome
      const formatError = validateProjectName(name);
      if (formatError) return formatError;

      // Poi controlla se esiste già un progetto con lo stesso nome
      const exists = await projectNameExists(groupId, name);
      if (exists) {
        return "Esiste già un progetto con questo nome nel gruppo";
      }

      return null;
    },
    [groupId],
  );

  // Crea un nuovo progetto
  const handleCreateProject = async (name) => {
    setIsCreating(true);
    try {
      await createProject(name, groupId, currentUser);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Errore creazione progetto:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Unisciti a un progetto condiviso tramite codice
  const handleJoinSharedProject = async (code) => {
    setIsJoining(true);
    setJoinError("");
    try {
      const project = await getProjectByShareCode(code);
      if (!project)
        throw new Error("Progetto non trovato. Verifica il codice.");
      if (project.groupId === groupId)
        throw new Error("Questo progetto appartiene già al tuo gruppo.");

      await requestJoinSharedProject(
        project.id,
        {
          groupId,
          groupName: group?.name || "Gruppo",
          members: group?.members || [],
        },
        {
          uid: currentUser?.uid,
          displayName: currentUser?.displayName || currentUser?.email,
        },
      );
      setIsJoinModalOpen(false);
    } catch (error) {
      setJoinError(error.message);
      throw error;
    } finally {
      setIsJoining(false);
    }
  };

  const validateJoinCode = (code) => {
    if (!code || code.trim().length === 0)
      return "Inserisci il codice del progetto";
    if (code.trim().length !== 10)
      return "Il codice deve essere di 10 caratteri";
    if (joinError) return joinError;
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" />
      </div>
    );
  }

  // Filtra i progetti escludendo quelli in eliminazione (UI ottimistica)
  const visibleProjects = projects.filter(
    (project) => !deletingProjectIds.has(project.id),
  );

  return (
    <>
      {/* Griglia responsive: 3 colonne mobile, 4 tablet, 5 desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Progetti esistenti */}
        {visibleProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            currentUserId={currentUser?.uid}
            isShared={project.groupId !== groupId}
            sharedRole={project._sharedRole}
            onClick={() => {
              // Blocca apertura se pending
              if (project._sharedRole === "pending") return;
              onProjectClick({ project, group });
            }}
          />
        ))}

        {/* Tasto crea nuovo progetto - sempre alla fine */}
        <CreateProjectButton onClick={() => setIsCreateModalOpen(true)} />

        {/* Tasto aggiungi progetto condiviso */}
        <JoinSharedProjectButton onClick={() => setIsJoinModalOpen(true)} />
      </div>

      {/* Modale crea progetto */}
      <InputModal
        isOpen={isCreateModalOpen}
        title="Nuovo progetto"
        label="Nome progetto"
        placeholder="Inserisci il nome del progetto"
        initialValue=""
        confirmText="Crea"
        onConfirm={handleCreateProject}
        onClose={() => setIsCreateModalOpen(false)}
        validate={validateProjectNameWithDuplicate}
        loading={isCreating}
        zIndex={1020}
      />

      {/* Modale aggiungi progetto condiviso */}
      <InputModal
        isOpen={isJoinModalOpen}
        title="Aggiungi progetto condiviso"
        label="Codice progetto"
        placeholder="Inserisci il codice di 10 caratteri"
        initialValue=""
        confirmText="Richiedi accesso"
        onConfirm={(code) => handleJoinSharedProject(code.toUpperCase())}
        onClose={() => {
          setIsJoinModalOpen(false);
          setJoinError("");
        }}
        validate={validateJoinCode}
        loading={isJoining}
        zIndex={1020}
        exactLength={10}
      />
    </>
  );
};

export default ProjectGrid;
