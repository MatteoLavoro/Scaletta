import { useState, useEffect } from "react";
import { Modal } from "../modal";
import CopyableInfoBox from "../ui/CopyableInfoBox";
import InfoBox from "../ui/InfoBox";
import Divider from "../ui/Divider";
import { CheckIcon, CloseIcon, UsersIcon } from "../icons";
import {
  acceptSharedGroup,
  removeSharedGroup,
  updateSharedGroupRole,
  subscribeToProject,
  ensureProjectShareCode,
} from "../../services/projects";

const ROLE_LABELS = { viewer: "Visualizzatore", editor: "Editor" };

/**
 * ProjectShareModal - Gestione condivisione progetto (solo owner)
 */
const ProjectShareModal = ({ isOpen, project, onClose }) => {
  const [liveProject, setLiveProject] = useState(null);
  const [loading, setLoading] = useState({});
  const [resolvedShareCode, setResolvedShareCode] = useState(null);

  // Listener in tempo reale
  useEffect(() => {
    if (!isOpen || !project?.id) return;
    const unsub = subscribeToProject(project.id, (p) => setLiveProject(p));
    return () => unsub();
  }, [isOpen, project?.id]);

  // Genera shareCode lazy se mancante
  useEffect(() => {
    if (!isOpen || !project?.id) return;
    const current = liveProject || project;
    if (current?.shareCode) {
      setResolvedShareCode(current.shareCode);
      return;
    }
    if (resolvedShareCode) return;
    ensureProjectShareCode(project.id)
      .then(setResolvedShareCode)
      .catch(console.error);
  }, [isOpen, project?.id, liveProject, project, resolvedShareCode]);

  const data = liveProject || project;
  if (!data) return null;

  const shareCode = resolvedShareCode || data.shareCode || "";
  const pending = (data.sharedGroups || []).filter((g) => g.role === "pending");
  const active = (data.sharedGroups || []).filter((g) => g.role !== "pending");

  const setLoaderFor = (key, val) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const handleAccept = async (groupId) => {
    setLoaderFor(groupId + "_accept", true);
    try {
      await acceptSharedGroup(data.id, groupId);
    } finally {
      setLoaderFor(groupId + "_accept", false);
    }
  };

  const handleDeny = async (groupId) => {
    setLoaderFor(groupId + "_deny", true);
    try {
      await removeSharedGroup(data.id, groupId);
    } finally {
      setLoaderFor(groupId + "_deny", false);
    }
  };

  const handleRemove = async (groupId) => {
    setLoaderFor(groupId + "_remove", true);
    try {
      await removeSharedGroup(data.id, groupId);
    } finally {
      setLoaderFor(groupId + "_remove", false);
    }
  };

  const handleToggleRole = async (groupId, currentRole) => {
    const newRole = currentRole === "viewer" ? "editor" : "viewer";
    setLoaderFor(groupId + "_role", true);
    try {
      await updateSharedGroupRole(data.id, groupId, newRole);
    } finally {
      setLoaderFor(groupId + "_role", false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestione Condivisione"
      variant="info"
      zIndex={1000}
    >
      <div className="flex flex-col gap-4">
        {/* Codice condivisione */}
        <div className="flex flex-col gap-1.5">
          <CopyableInfoBox
            title="Codice condivisione"
            value={shareCode}
            color="blue"
          />
          <p className="text-xs text-text-secondary text-center px-1">
            Condividi questo codice per dare accesso al progetto ad altri gruppi
          </p>
        </div>

        {/* Richieste in attesa */}
        {pending.length > 0 && (
          <>
            <Divider spacing="xs" />
            <InfoBox
              title="Richieste in attesa"
              titleExtra={`(${pending.length})`}
              color="orange"
            >
              <div className="flex flex-col gap-2 w-full">
                {pending.map((g) => (
                  <div
                    key={g.groupId}
                    className="flex flex-col gap-2 p-2 rounded-lg bg-bg-primary/60"
                  >
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="w-4 h-4 text-text-secondary shrink-0" />
                      <span className="text-sm font-semibold text-text-primary truncate">
                        {g.groupName}
                      </span>
                    </div>
                    {g.members?.length > 0 && (
                      <p className="text-xs text-text-secondary">
                        Membri:{" "}
                        {g.members
                          .map((m) => m.displayName || m.email)
                          .join(", ")}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(g.groupId)}
                        disabled={loading[g.groupId + "_accept"]}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-700 dark:text-green-400 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Accetta
                      </button>
                      <button
                        onClick={() => handleDeny(g.groupId)}
                        disabled={loading[g.groupId + "_deny"]}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-400 text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                        Nega
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </InfoBox>
          </>
        )}

        {/* Gruppi con accesso */}
        {active.length > 0 && (
          <>
            <Divider spacing="xs" />
            <InfoBox
              title="Gruppi con accesso"
              titleExtra={`(${active.length})`}
              color="teal"
            >
              <div className="flex flex-col gap-2 w-full">
                {active.map((g) => (
                  <div
                    key={g.groupId}
                    className="flex flex-col gap-2 p-2 rounded-lg bg-bg-primary/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <UsersIcon className="w-4 h-4 text-text-secondary shrink-0" />
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {g.groupName}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(g.groupId)}
                        disabled={loading[g.groupId + "_remove"]}
                        className="shrink-0 p-1 rounded-lg hover:bg-red-500/15 text-text-muted hover:text-red-500 transition-colors disabled:opacity-50"
                        aria-label="Rimuovi gruppo"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {g.members?.length > 0 && (
                      <p className="text-xs text-text-secondary">
                        Membri:{" "}
                        {g.members
                          .map((m) => m.displayName || m.email)
                          .join(", ")}
                      </p>
                    )}
                    {/* Toggle ruolo */}
                    <button
                      onClick={() => handleToggleRole(g.groupId, g.role)}
                      disabled={loading[g.groupId + "_role"]}
                      className="self-start flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-border text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors disabled:opacity-50"
                    >
                      <span>{ROLE_LABELS[g.role] || g.role}</span>
                      <span className="text-text-muted">
                        → {g.role === "viewer" ? "Editor" : "Visualizzatore"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </InfoBox>
          </>
        )}

        {pending.length === 0 && active.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-2">
            Nessun gruppo ha ancora richiesto l&apos;accesso
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ProjectShareModal;
