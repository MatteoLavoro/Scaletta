import { useState, useEffect } from "react";
import { Modal } from "../modal";
import CopyableInfoBox from "../ui/CopyableInfoBox";
import Divider from "../ui/Divider";
import {
  CheckIcon,
  CloseIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  LinkIcon,
} from "../icons";
import {
  acceptSharedGroup,
  removeSharedGroup,
  updateSharedGroupRole,
  subscribeToProject,
  ensureProjectShareCode,
} from "../../services/projects";

const ROLE_CONFIG = {
  viewer: {
    label: "Visualizzatore",
    icon: EyeIcon,
    bg: "bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/30",
  },
  editor: {
    label: "Editor",
    icon: PencilIcon,
    bg: "bg-emerald-500/15",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/30",
  },
};

const GroupAvatar = ({ name, color = "bg-primary" }) => {
  const letter = (name || "?")[0].toUpperCase();
  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white ${color}`}
    >
      {letter}
    </div>
  );
};

const MemberPills = ({ members }) => {
  if (!members?.length) return null;
  const visible = members.slice(0, 4);
  const rest = members.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((m) => (
        <span
          key={m.uid}
          className="inline-flex items-center px-2 py-0.5 rounded-full bg-bg-tertiary border border-border text-[11px] text-text-secondary"
        >
          {m.displayName || m.email}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-bg-tertiary border border-border text-[11px] text-text-muted">
          +{rest}
        </span>
      )}
    </div>
  );
};

const GROUP_AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-teal-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-pink-500",
  "bg-indigo-500",
];
const getAvatarColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return GROUP_AVATAR_COLORS[Math.abs(hash) % GROUP_AVATAR_COLORS.length];
};

/**
 * ProjectShareModal - Gestione condivisione progetto (solo owner)
 */
const ProjectShareModal = ({ isOpen, project, onClose }) => {
  const [liveProject, setLiveProject] = useState(null);
  const [loading, setLoading] = useState({});
  const [resolvedShareCode, setResolvedShareCode] = useState(null);

  useEffect(() => {
    if (!isOpen || !project?.id) return;
    const unsub = subscribeToProject(project.id, (p) => setLiveProject(p));
    return () => unsub();
  }, [isOpen, project?.id]);

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
      <div className="flex flex-col gap-5">
        {/* ── Sezione codice ── */}
        <div className="flex flex-col gap-2">
          <CopyableInfoBox
            title="Codice condivisione"
            value={shareCode}
            color="blue"
          />
          <div className="flex items-start gap-1.5 px-1">
            <LinkIcon className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Condividi questo codice per dare accesso al progetto ad altri
              gruppi
            </p>
          </div>
        </div>

        {/* ── Richieste in attesa ── */}
        {pending.length > 0 && (
          <>
            <Divider spacing="xs" />
            <div className="flex flex-col gap-3">
              {/* Intestazione sezione */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20">
                  <ClockIcon className="w-3 h-3 text-orange-500" />
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  Richieste in attesa
                </span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  {pending.length}
                </span>
              </div>

              {pending.map((g) => (
                <div
                  key={g.groupId}
                  className="flex flex-col gap-3 p-3 rounded-xl border border-orange-500/20 bg-orange-500/5"
                >
                  {/* Header gruppo */}
                  <div className="flex items-center gap-2.5">
                    <GroupAvatar
                      name={g.groupName}
                      color={getAvatarColor(g.groupId)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {g.groupName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        Ha richiesto l&apos;accesso
                      </p>
                    </div>
                  </div>

                  {/* Membri */}
                  {g.members?.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
                        Membri ({g.members.length})
                      </p>
                      <MemberPills members={g.members} />
                    </div>
                  )}

                  {/* Azioni */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAccept(g.groupId)}
                      disabled={loading[g.groupId + "_accept"]}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Accetta
                    </button>
                    <button
                      onClick={() => handleDeny(g.groupId)}
                      disabled={loading[g.groupId + "_deny"]}
                      className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border bg-bg-tertiary hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 active:scale-[0.98] text-text-secondary text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CloseIcon className="w-4 h-4" />
                      Nega
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Gruppi con accesso ── */}
        {active.length > 0 && (
          <>
            <Divider spacing="xs" />
            <div className="flex flex-col gap-3">
              {/* Intestazione sezione */}
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-500/20">
                  <UsersIcon className="w-3 h-3 text-teal-500" />
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  Gruppi con accesso
                </span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400">
                  {active.length}
                </span>
              </div>

              {active.map((g) => {
                const roleConf = ROLE_CONFIG[g.role] || ROLE_CONFIG.viewer;
                const RoleIcon = roleConf.icon;
                const nextRole = g.role === "viewer" ? "editor" : "viewer";
                const nextConf = ROLE_CONFIG[nextRole];
                const NextIcon = nextConf.icon;
                const isRoleLoading = loading[g.groupId + "_role"];
                const isRemoveLoading = loading[g.groupId + "_remove"];

                return (
                  <div
                    key={g.groupId}
                    className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-bg-tertiary/50"
                  >
                    {/* Header: avatar + nome + badge ruolo + rimuovi */}
                    <div className="flex items-center gap-2.5">
                      <GroupAvatar
                        name={g.groupName}
                        color={getAvatarColor(g.groupId)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {g.groupName}
                        </p>
                        {/* Badge ruolo inline sotto il nome */}
                        <div
                          className={`inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md border text-[11px] font-medium ${roleConf.bg} ${roleConf.text} ${roleConf.border}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleConf.label}
                        </div>
                      </div>
                      {/* Tasto rimuovi */}
                      <button
                        onClick={() => handleRemove(g.groupId)}
                        disabled={isRemoveLoading}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-bg-secondary hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 text-text-muted transition-all disabled:opacity-50 active:scale-95"
                        aria-label="Rimuovi accesso"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Membri */}
                    {g.members?.length > 0 && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">
                          Membri ({g.members.length})
                        </p>
                        <MemberPills members={g.members} />
                      </div>
                    )}

                    {/* Toggle ruolo */}
                    <button
                      onClick={() => handleToggleRole(g.groupId, g.role)}
                      disabled={isRoleLoading}
                      className="w-full flex items-center gap-2 py-2 px-3 rounded-xl border border-border bg-bg-secondary hover:bg-bg-tertiary active:scale-[0.99] transition-all disabled:opacity-50 text-sm"
                    >
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${roleConf.bg} ${roleConf.text} ${roleConf.border}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {roleConf.label}
                      </div>
                      <ChevronRightIcon className="w-3.5 h-3.5 text-text-muted" />
                      <div
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${nextConf.bg} ${nextConf.text} ${nextConf.border}`}
                      >
                        <NextIcon className="w-3 h-3" />
                        {nextConf.label}
                      </div>
                      <span className="ml-auto text-xs text-text-muted">
                        {isRoleLoading ? "..." : "Cambia ruolo"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Stato vuoto */}
        {pending.length === 0 && active.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-tertiary border border-border flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              Nessun gruppo collegato
            </p>
            <p className="text-xs text-text-muted max-w-[220px]">
              Condividi il codice sopra per invitare altri gruppi
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProjectShareModal;
