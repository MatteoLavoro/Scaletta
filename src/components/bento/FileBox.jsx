import { useState, useRef } from "react";
import { PlusIcon, DownloadIcon, TrashIcon, FolderIcon } from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { FileUploadModal } from "../modal";
import { ConfirmModal } from "../modal";
import {
  uploadFile,
  deleteFile,
  downloadFile,
  formatFileSize,
  getFileType,
} from "../../services/files";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * FileRowUploading - Riga file in fase di upload con progress bar
 */
const FileRowUploading = ({ file, progress }) => {
  return (
    <div className="flex items-center gap-3 bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
      {/* Icona tipo file */}
      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
        <FolderIcon className="w-5 h-5" />
      </div>

      {/* Info file + progress bar */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {file.name}
        </p>
        <p className="text-xs text-text-muted mb-1.5">
          {getFileType(file.name)} • {formatFileSize(file.size)}
        </p>
        {/* Progress bar */}
        <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Placeholder per i tasti (spazio vuoto) */}
      <div className="w-[76px] shrink-0 flex items-center justify-center">
        <span className="text-xs text-text-muted">{progress}%</span>
      </div>
    </div>
  );
};

/**
 * FileRow - Singola riga per un file completato
 */
const FileRow = ({ file, onDownload, onDelete, primaryColor }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(file);
    setIsDeleting(false);
  };

  return (
    <div className="flex items-center gap-3 bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
      {/* Icona tipo file */}
      <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
        <FolderIcon className="w-5 h-5" />
      </div>

      {/* Info file */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {file.name}
        </p>
        <p className="text-xs text-text-muted">
          {file.fileType || getFileType(file.name)} •{" "}
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Tasti azione */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Download */}
        <button
          onClick={() => onDownload(file)}
          className="p-2 rounded-lg transition-colors hover:opacity-80"
          style={{
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
          aria-label="Scarica file"
          title="Scarica"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>

        {/* Elimina */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          aria-label="Elimina file"
          title="Elimina"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * FileBox - Bento Box per i file
 *
 * Box specializzato per contenere file di qualsiasi tipo.
 * Lista verticale con info file, download e delete.
 *
 * @param {string} projectId - ID del progetto (per upload)
 * @param {string} title - Titolo del box
 * @param {array} files - Array di file { id, url, name, size, type, fileType, storagePath }
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onFilesChange - Callback quando cambiano i file
 * @param {function} onDelete - Callback per eliminare il box
 */
const FileBox = ({
  projectId,
  title = "File",
  files = [],
  isPinned = false,
  onPinToggle,
  onTitleChange,
  onFilesChange,
  onDelete,
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState([]); // Array di { file, progress, id }
  const [isDeleteFileConfirmOpen, setIsDeleteFileConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);

  // Ref per tenere traccia dei file completamente caricati durante upload multipli
  const completedFilesRef = useRef([]);

  const { colors, accentColor, isDark } = useTheme();

  // Ottieni il colore primario del tema
  const themeColors =
    colors[accentColor]?.[isDark ? "dark" : "light"] ||
    colors.teal[isDark ? "dark" : "light"];
  const primaryColor = themeColors.primary;

  // Menu aggiuntivo per il box file
  const fileMenuItems = [
    {
      label: "Aggiungi file",
      icon: <PlusIcon className="w-5 h-5" />,
      onClick: () => {
        setUploadResetKey((k) => k + 1);
        setIsUploadModalOpen(true);
      },
    },
  ];

  // Gestione upload file - carica in background con progress individuale
  const handleUpload = async (selectedFiles) => {
    if (!projectId || selectedFiles.length === 0) return;

    // Chiudi il modale immediatamente
    setIsUploadModalOpen(false);

    // Reset completed files ref
    completedFilesRef.current = [];

    // Crea oggetti per tracking upload con ID unico
    const uploadingItems = selectedFiles.map((file, index) => ({
      file,
      progress: 0,
      id: `upload-${Date.now()}-${index}`,
    }));

    setUploadingFiles(uploadingItems);

    // Carica ogni file in parallelo
    const uploadPromises = selectedFiles.map(async (file, index) => {
      try {
        const uploadedFile = await uploadFile(projectId, file, (progress) => {
          // Aggiorna il progress per questo file specifico
          setUploadingFiles((prev) =>
            prev.map((item, i) => (i === index ? { ...item, progress } : item))
          );
        });

        // Aggiungi alla ref dei file completati
        completedFilesRef.current.push(uploadedFile);

        return uploadedFile;
      } catch (error) {
        console.error(`Errore upload ${file.name}:`, error);
        return null;
      }
    });

    // Attendi tutti gli upload
    await Promise.all(uploadPromises);

    // Aggiorna files con tutti quelli completati
    if (completedFilesRef.current.length > 0) {
      const newFiles = [...files, ...completedFilesRef.current];
      onFilesChange?.(newFiles);
    }

    // Pulisci stato upload
    setUploadingFiles([]);
    completedFilesRef.current = [];
  };

  // Gestione download
  const handleDownload = (file) => {
    downloadFile(file.url, file.name);
  };

  // Apri conferma eliminazione file
  const handleDeleteFileClick = (file) => {
    setFileToDelete(file);
    setIsDeleteFileConfirmOpen(true);
  };

  // Conferma eliminazione file
  const handleDeleteFileConfirm = async () => {
    if (!fileToDelete) return;

    try {
      // Elimina da storage
      if (fileToDelete.storagePath) {
        await deleteFile(fileToDelete.storagePath);
      }

      // Aggiorna stato
      const newFiles = files.filter((f) => f.id !== fileToDelete.id);
      onFilesChange?.(newFiles);
    } catch (error) {
      console.error("Errore eliminazione file:", error);
    } finally {
      setIsDeleteFileConfirmOpen(false);
      setFileToDelete(null);
    }
  };

  const hasFiles = files.length > 0;
  const hasUploadingFiles = uploadingFiles.length > 0;

  return (
    <>
      <BaseBentoBox
        title={title}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={fileMenuItems}
        minHeight={hasFiles || hasUploadingFiles ? undefined : 150}
      >
        {hasFiles || hasUploadingFiles ? (
          // Lista file
          <div className="space-y-2">
            {/* File completati */}
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onDownload={handleDownload}
                onDelete={handleDeleteFileClick}
                primaryColor={primaryColor}
              />
            ))}

            {/* File in upload con progress individuale */}
            {uploadingFiles.map((item) => (
              <FileRowUploading
                key={item.id}
                file={item.file}
                progress={item.progress}
              />
            ))}
          </div>
        ) : (
          // Stato vuoto - uniforme
          <button
            onClick={() => {
              setUploadResetKey((k) => k + 1);
              setIsUploadModalOpen(true);
            }}
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
              <FolderIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Aggiungi file</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per caricare
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale upload file */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onConfirm={handleUpload}
        resetKey={uploadResetKey}
        zIndex={1020}
      />

      {/* Modale conferma eliminazione file */}
      <ConfirmModal
        isOpen={isDeleteFileConfirmOpen}
        title="Elimina file"
        message={`Sei sicuro di voler eliminare "${fileToDelete?.name}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        confirmVariant="danger"
        onConfirm={handleDeleteFileConfirm}
        onCancel={() => {
          setIsDeleteFileConfirmOpen(false);
          setFileToDelete(null);
        }}
        isDanger
        zIndex={1030}
      />
    </>
  );
};

export default FileBox;
