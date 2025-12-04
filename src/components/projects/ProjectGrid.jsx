import { useState, useEffect } from "react";
import ProjectCard from "./ProjectCard";
import CreateProjectButton from "./CreateProjectButton";
import { InputModal } from "../modal";
import { Spinner } from "../ui";
import { createProject, getProjectsByGroup } from "../../services/projects";
import { validateProjectName } from "../../utils/projectValidation";

/**
 * ProjectGrid - Griglia di progetti con 3 colonne su mobile
 *
 * @param {string} groupId - ID del gruppo
 * @param {object} group - Oggetto gruppo completo (per founder check)
 * @param {object} currentUser - Utente corrente { uid, displayName, email }
 * @param {function} onProjectClick - Callback quando un progetto viene cliccato (riceve { project, group })
 * @param {function} onProjectCountChange - Callback quando cambia il numero di progetti (riceve delta: +1 o -1)
 */
const ProjectGrid = ({
  groupId,
  group,
  currentUser,
  onProjectClick,
  onProjectCountChange,
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Carica i progetti del gruppo
  useEffect(() => {
    const loadProjects = async () => {
      if (!groupId) return;

      try {
        const groupProjects = await getProjectsByGroup(groupId);
        setProjects(groupProjects);
      } catch (error) {
        console.error("Errore caricamento progetti:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [groupId]);

  // Crea un nuovo progetto
  const handleCreateProject = async (name) => {
    setIsCreating(true);
    try {
      const newProject = await createProject(name, groupId, currentUser);
      setProjects((prev) => [newProject, ...prev]);
      onProjectCountChange?.(1); // Incrementa il contatore
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Errore creazione progetto:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <>
      {/* Griglia responsive: 3 colonne mobile, 4 tablet, 5 desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Progetti esistenti */}
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick({ project, group })}
          />
        ))}

        {/* Tasto crea nuovo progetto - sempre alla fine */}
        <CreateProjectButton onClick={() => setIsCreateModalOpen(true)} />
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
        validate={validateProjectName}
        loading={isCreating}
        zIndex={1020}
      />
    </>
  );
};

export default ProjectGrid;
