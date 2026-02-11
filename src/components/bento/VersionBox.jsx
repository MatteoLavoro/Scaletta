import { useState } from "react";
import {
  PlusIcon,
  DownloadIcon,
  TrashIcon,
  FolderIcon,
  ClockIcon,
  ImageIcon,
  FileTextIcon,
  FileSpreadsheetIcon,
  PresentationIcon,
  MusicIcon,
  VideoIcon,
  CodeIcon,
  FileArchiveIcon,
  RulerIcon,
} from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { VersionUploadModal } from "../modal";
import { ConfirmModal } from "../modal";
import {
  uploadFile,
  downloadFile,
  formatFileSize,
  getFileType,
  getFileExtension,
} from "../../services/files";
import { addBentoBoxVersionAtomic } from "../../services/projects";

/**
 * Renderizza l'icona appropriata per un tipo di file
 */
const renderFileIcon = (filename) => {
  const ext = getFileExtension(filename).toLowerCase();

  // Immagini
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
  ) {
    return <ImageIcon className="w-5 h-5" />;
  }

  // PDF
  if (ext === "pdf") {
    return <FileTextIcon className="w-5 h-5" />;
  }

  // Documenti di testo
  if (["doc", "docx", "odt", "rtf", "txt"].includes(ext)) {
    return <FileTextIcon className="w-5 h-5" />;
  }

  // Fogli di calcolo
  if (["xls", "xlsx", "ods", "csv"].includes(ext)) {
    return <FileSpreadsheetIcon className="w-5 h-5" />;
  }

  // Presentazioni
  if (["ppt", "pptx", "odp"].includes(ext)) {
    return <PresentationIcon className="w-5 h-5" />;
  }

  // Audio
  if (["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma"].includes(ext)) {
    return <MusicIcon className="w-5 h-5" />;
  }

  // Video
  if (["mp4", "avi", "mkv", "mov", "webm", "wmv", "flv"].includes(ext)) {
    return <VideoIcon className="w-5 h-5" />;
  }

  // Archivi compressi
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) {
    return <FileArchiveIcon className="w-5 h-5" />;
  }

  // Codice sorgente
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
      "rb",
      "php",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "yaml",
      "yml",
      "md",
      "sql",
    ].includes(ext)
  ) {
    return <CodeIcon className="w-5 h-5" />;
  }

  // CAD e disegni tecnici
  if (["dwg", "dxf", "dwf", "dgn"].includes(ext)) {
    return <RulerIcon className="w-5 h-5" />;
  }

  // File 3D (modelli, stampa 3D, scambio)
  if (
    [
      "stl",
      "obj",
      "3ds",
      "skp",
      "blend",
      "fbx",
      "gltf",
      "glb",
      "step",
      "stp",
      "iges",
      "igs",
      "3mf",
      "dae",
      "x3d",
      "vrml",
      "wrl",
      "c4d",
      "max",
      "ma",
      "mb",
      "lwo",
      "lws",
      "ply",
      "amf",
    ].includes(ext)
  ) {
    return <RulerIcon className="w-5 h-5" />;
  }

  // Default: cartella generica
  return <FolderIcon className="w-5 h-5" />;
};

/**
 * Tag colors mapping
 */
const TAG_COLORS = {
  "bug-fix": {
    bg: "bg-red-500/15",
    text: "text-red-500",
    border: "border-red-500/30",
  },
  feature: {
    bg: "bg-green-500/15",
    text: "text-green-500",
    border: "border-green-500/30",
  },
  modification: {
    bg: "bg-blue-500/15",
    text: "text-blue-500",
    border: "border-blue-500/30",
  },
  other: {
    bg: "bg-purple-500/15",
    text: "text-purple-500",
    border: "border-purple-500/30",
  },
};

const TAG_LABELS = {
  "bug-fix": "Corretti errori",
  feature: "Aggiunte",
  modification: "Modifiche",
  other: "Altro",
};

// Ordine dei tag (come nel modale)
const TAG_ORDER = ["bug-fix", "feature", "modification", "other"];

/**
 * VersionRowUploading - Riga versione in fase di upload con progress bar
 */
const VersionRowUploading = ({ versionData, progress }) => {
  return (
    <div className="bg-bg-tertiary/50 border border-border/50 rounded-lg p-3 space-y-2">
      {/* Info file + progress */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
          <FolderIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            Versione {versionData.versionNumber}
          </p>
          <p className="text-xs text-text-muted mb-1.5">
            Caricamento in corso...
          </p>
          {/* Progress bar */}
          <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="w-[76px] shrink-0 flex items-center justify-center">
          <span className="text-xs text-text-muted">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

/**
 * VersionRow - Singola riga per una versione completata
 */
const VersionRow = ({ version, onDownload, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await onDelete(version);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleDownloadClick = () => {
    onDownload(version);
  };

  // Formatta la data
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Ordina i tag secondo TAG_ORDER
  const sortedTags = version.tags
    ? [...version.tags].sort((a, b) => {
        const indexA = TAG_ORDER.indexOf(a);
        const indexB = TAG_ORDER.indexOf(b);
        return indexA - indexB;
      })
    : [];

  // Font dinamico basato sul numero di tag
  const getTagFontSize = () => {
    const tagCount = sortedTags.length;
    if (tagCount === 0 || tagCount === 1) return "text-xs";
    if (tagCount === 2) return "text-[11px]";
    if (tagCount === 3) return "text-[10px]";
    return "text-[9px]"; // 4 tags
  };

  const tagFontSize = getTagFontSize();

  // Versione eliminata
  const isDeleted = version.deleted === true;

  return (
    <>
      <div
        className={`bg-bg-tertiary/50 border border-border/50 rounded-lg space-y-2 ${
          isDeleted ? "p-2" : "p-3"
        }`}
      >
        {/* Header: Versione + Data - Centrato */}
        <div
          className={`flex items-center justify-center gap-2 text-xs text-text-muted ${
            isDeleted ? "mb-1" : "mb-2"
          }`}
        >
          <span className="font-medium">Versione: {version.versionNumber}</span>
          <span>|</span>
          <div className="flex items-center gap-1">
            <ClockIcon className="w-3 h-3" />
            <span>{formatDate(version.uploadedAt)}</span>
          </div>
        </div>

        {isDeleted ? (
          /* Versione eliminata */
          <>
            <div className="text-center py-1.5 space-y-1">
              <p className="text-sm font-medium text-red-500">Eliminata</p>
              <div className="flex items-center justify-center gap-1 text-xs text-text-muted">
                <ClockIcon className="w-3 h-3" />
                <span>{formatDate(version.deletedAt)}</span>
              </div>
            </div>
          </>
        ) : (
          /* Versione normale */
          <>
            {/* Riga File (stile identico a FileBox) */}
            <div className="flex items-center gap-3">
              {/* Icona tipo file */}
              <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
                {renderFileIcon(version.name)}
              </div>

              {/* Info file */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {version.name}
                </p>
                <p className="text-xs text-text-muted">
                  {getFileType(version.name)} • {formatFileSize(version.size)}
                </p>
              </div>

              {/* Tasti azione colorati */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Download - verde/primario */}
                <button
                  onClick={handleDownloadClick}
                  className="p-2 rounded-lg transition-colors hover:opacity-80 bg-primary/20 text-primary"
                  aria-label="Scarica versione"
                  title="Scarica"
                  disabled={isDeleting}
                >
                  <DownloadIcon className="w-4 h-4" />
                </button>

                {/* Elimina - rosso */}
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  aria-label="Elimina versione"
                  title="Elimina"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tag - Ridimensionamento dinamico basato sul numero */}
            <div className="flex flex-nowrap gap-1 overflow-x-auto">
              {sortedTags.length > 0 ? (
                sortedTags.map((tagId) => {
                  const colors = TAG_COLORS[tagId] || TAG_COLORS.modification;
                  const label = TAG_LABELS[tagId] || tagId;
                  return (
                    <span
                      key={tagId}
                      className={`
                        px-1.5 py-0.5 rounded ${tagFontSize} font-medium whitespace-nowrap
                        ${colors.bg} ${colors.text} border ${colors.border}
                      `}
                    >
                      {label}
                    </span>
                  );
                })
              ) : (
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-muted border border-border whitespace-nowrap">
                  Nessun tag
                </span>
              )}
            </div>

            {/* Descrizione modifiche */}
            <div className="pt-1 border-t border-border/50">
              {version.description && version.description.trim() ? (
                <p className="text-sm text-text-secondary leading-relaxed">
                  {version.description}
                </p>
              ) : (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-muted border border-border">
                  Nessuna descrizione
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Elimina versione"
        message={`Sei sicuro di voler eliminare la versione ${version.versionNumber}?`}
        confirmLabel="Elimina"
        variant="danger"
        zIndex={2100}
        skipHistory={true}
      />
    </>
  );
};

/**
 * VersionBox - Box per il controllo delle versioni di un file
 *
 * Permette di tenere traccia di multiple versioni di uno stesso file,
 * con descrizione delle modifiche e tag per ogni versione.
 *
 * @param {string} projectId - ID del progetto
 * @param {string} boxId - ID del box (necessario per transaction atomica)
 * @param {string} title - Titolo del box
 * @param {array} versions - Array di versioni: { id, url, name, size, storagePath, versionNumber, description, tags, uploadedAt }
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {string} createdByName - Nome utente che ha creato il box
 * @param {Date|Timestamp} createdAt - Data creazione box
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback cambio titolo
 * @param {function} onVersionsChange - Callback quando cambiano le versioni
 * @param {function} onDelete - Callback eliminazione box
 */
const VersionBox = ({
  projectId,
  boxId,
  title,
  versions = [],
  isPinned = false,
  createdByName = null,
  createdAt = null,
  onPinToggle,
  onTitleChange,
  onVersionsChange,
  onDelete,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingVersion, setUploadingVersion] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Ordina versioni: più recenti prima
  const sortedVersions = [...versions].sort((a, b) => {
    return b.versionNumber - a.versionNumber;
  });

  // Handlers
  const handleAddVersionClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadConfirm = async (data) => {
    const { file, description, tags } = data;

    // Mostra upload in corso (senza versionNumber perché verrà assegnato atomicamente)
    setUploadingVersion({
      versionNumber: "...",
      description,
      tags,
    });
    setUploadProgress(0);
    setIsUploadModalOpen(false);

    try {
      // 1. Upload file su Storage (con progress tracking)
      const uploadedFile = await uploadFile(projectId, file, (progress) => {
        setUploadProgress(progress);
      });

      // 2. Aggiungi versione atomicamente usando transaction
      // Questo previene race conditions quando più utenti caricano contemporaneamente
      await addBentoBoxVersionAtomic(projectId, boxId, {
        ...uploadedFile,
        description,
        tags,
        uploadedAt: new Date(),
      });

      // 3. Reset stato upload (Firestore onSnapshot aggiornerà automaticamente la UI)
      setUploadingVersion(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Errore upload versione:", error);
      setUploadingVersion(null);
      setUploadProgress(0);
      alert("Errore durante il caricamento della versione");
    }
  };

  const handleDownload = async (version) => {
    try {
      await downloadFile(version.url, version.name);
    } catch (error) {
      console.error("Errore download versione:", error);
      alert("Errore durante il download della versione");
    }
  };

  const handleDeleteVersion = async (version) => {
    try {
      // Non eliminare il file dallo storage, solo marcare come eliminata
      // await deleteFile(version.storagePath);

      // Marca la versione come eliminata
      const updatedVersions = versions.map((v) =>
        v.id === version.id
          ? { ...v, deleted: true, deletedAt: new Date() }
          : v,
      );
      onVersionsChange(updatedVersions);
    } catch (error) {
      console.error("Errore eliminazione versione:", error);
      alert("Errore durante l'eliminazione della versione");
    }
  };

  return (
    <>
      <BaseBentoBox
        title={title}
        isPinned={isPinned}
        createdByName={createdByName}
        createdAt={createdAt}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={[
          {
            label: "Nuova versione",
            icon: <PlusIcon className="w-4 h-4" />,
            onClick: handleAddVersionClick,
          },
        ]}
      >
        {/* Contenuto */}
        <div className="space-y-3">
          {/* Versione in caricamento */}
          {uploadingVersion && (
            <VersionRowUploading
              versionData={uploadingVersion}
              progress={uploadProgress}
            />
          )}

          {/* Lista versioni */}
          {sortedVersions.length > 0 ? (
            <div className="space-y-2">
              {sortedVersions.map((version) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  onDownload={handleDownload}
                  onDelete={handleDeleteVersion}
                />
              ))}
            </div>
          ) : !uploadingVersion ? (
            <button
              onClick={handleAddVersionClick}
              className="
                w-full py-6
                flex flex-col items-center justify-center gap-3
                text-text-muted
                hover:text-primary
                transition-colors duration-200
                group
              "
            >
              <div className="w-14 h-14 rounded-full bg-bg-tertiary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <ClockIcon className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Aggiungi prima versione file
                </p>
                <p className="text-xs text-text-muted/70 mt-0.5">
                  Tocca per caricare
                </p>
              </div>
            </button>
          ) : null}
        </div>
      </BaseBentoBox>

      {/* Upload Modal */}
      <VersionUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleUploadConfirm}
        existingVersions={versions}
        zIndex={1010}
      />
    </>
  );
};

export default VersionBox;
