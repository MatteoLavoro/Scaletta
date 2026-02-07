import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "../modal";
import { UploadIcon, CloseIcon, FolderIcon } from "../icons";
import {
  validateFile,
  formatFileSize,
  getFileType,
  getFileExtension,
} from "../../services/files";

/**
 * Tag predefiniti per le versioni
 */
const VERSION_TAGS = [
  { id: "bug-fix", label: "Corretti errori", color: "red" },
  { id: "feature", label: "Aggiunte", color: "green" },
  { id: "modification", label: "Modifiche", color: "blue" },
  { id: "other", label: "Altro", color: "purple" },
];

/**
 * VersionUploadModalContent - Contenuto interno del modale
 */
const VersionUploadModalContent = ({
  onConfirm,
  onHasData,
  existingVersions = [],
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Notify parent when data is valid
  useEffect(() => {
    const hasValidData = selectedFile !== null;
    onHasData?.(hasValidData);

    // Pass data to parent when valid
    if (hasValidData && onConfirm) {
      onConfirm({
        file: selectedFile,
        description: description.trim(),
        tags: selectedTags,
      });
    }
  }, [selectedFile, description, selectedTags, onHasData, onConfirm]);

  // Processa il file selezionato (solo 1 file)
  const processFile = useCallback(
    (file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      // Controllo estensione: deve essere uguale al primo file caricato
      if (existingVersions.length > 0) {
        const firstFileExt = getFileExtension(existingVersions[0].name);
        const currentFileExt = getFileExtension(file.name);

        if (firstFileExt !== currentFileExt) {
          setError(
            `Il file deve avere la stessa estensione del primo file caricato (.${firstFileExt})`,
          );
          return;
        }
      }

      setSelectedFile(file);
      setError(null);
    },
    [existingVersions],
  );

  // Handle file input change
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = "";
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Prendi solo il primo file
      processFile(files[0]);
    }
  };

  // Rimuovi file selezionato
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  // Toggle tag selection
  const handleToggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  // Click sulla drop zone apre il file picker
  const handleDropZoneClick = () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      {/* Drop Zone / File Selected */}
      {!selectedFile ? (
        <div
          ref={dropZoneRef}
          onClick={handleDropZoneClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative
            border-2 border-dashed rounded-xl
            p-8
            flex flex-col items-center justify-center
            cursor-pointer
            transition-all duration-200
            ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-bg-tertiary/50"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div
            className={`
            w-16 h-16 rounded-full
            flex items-center justify-center
            mb-4
            transition-all duration-200
            ${
              isDragging
                ? "bg-primary/20 scale-110"
                : "bg-primary/10 group-hover:bg-primary/15"
            }
          `}
          >
            <UploadIcon
              className={`w-8 h-8 transition-colors ${
                isDragging ? "text-primary" : "text-text-muted"
              }`}
            />
          </div>

          <p className="text-base font-medium text-text-primary mb-2">
            {isDragging ? "Rilascia il file qui" : "Carica nuova versione"}
          </p>
          <p className="text-sm text-text-muted text-center">
            Trascina un file o clicca per selezionare
            <br />
            <span className="text-xs">Max 50MB</span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-bg-tertiary/50 border border-border/50 rounded-lg p-3">
          {/* Icona tipo file */}
          <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-text-muted shrink-0">
            <FolderIcon className="w-5 h-5" />
          </div>

          {/* Info file */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-text-muted">
              {getFileType(selectedFile.name)} •{" "}
              {formatFileSize(selectedFile.size)}
            </p>
          </div>

          {/* Tasto rimuovi */}
          <button
            onClick={handleRemoveFile}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-bg-secondary hover:bg-error/10 text-text-muted hover:text-error transition-all"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Errore */}
      {error && (
        <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/30 rounded-lg p-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Tag */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-text-primary text-center">
          Tag
        </label>
        <div className="flex flex-nowrap justify-center gap-1.5 overflow-x-auto">
          {VERSION_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            const colorClasses = {
              red: isSelected
                ? "bg-red-500/20 text-red-500 border-red-500/50"
                : "bg-bg-tertiary text-text-muted border-border hover:border-red-500/30",
              green: isSelected
                ? "bg-green-500/20 text-green-500 border-green-500/50"
                : "bg-bg-tertiary text-text-muted border-border hover:border-green-500/30",
              blue: isSelected
                ? "bg-blue-500/20 text-blue-500 border-blue-500/50"
                : "bg-bg-tertiary text-text-muted border-border hover:border-blue-500/30",
              purple: isSelected
                ? "bg-purple-500/20 text-purple-500 border-purple-500/50"
                : "bg-bg-tertiary text-text-muted border-border hover:border-purple-500/30",
            };
            return (
              <button
                key={tag.id}
                onClick={() => handleToggleTag(tag.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                  border-2 transition-all duration-200
                  ${colorClasses[tag.color]}
                `}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Campo descrizione modifiche */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary text-center">
          Descrizione modifiche
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrivi le modifiche apportate in questa versione..."
          className="
            w-full px-3 py-2
            bg-bg-tertiary border border-border
            rounded-lg
            text-sm text-text-primary placeholder-text-muted text-center
            focus:outline-none focus:border-primary
            resize-none
            transition-colors
          "
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-text-muted text-center">
          {description.length}/500 caratteri
        </p>
      </div>
    </>
  );
};

/**
 * VersionUploadModal - Modale per caricare una nuova versione
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback per chiudere il modale
 * @param {function} onConfirm - Callback con i dati: { file, description, tags }
 * @param {array} existingVersions - Versioni già caricate (per controllo estensione)
 * @param {number} zIndex - z-index per modali annidati
 */
const VersionUploadModal = ({
  isOpen,
  onClose,
  onConfirm,
  existingVersions = [],
  zIndex,
}) => {
  const [hasValidData, setHasValidData] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const contentDataRef = useRef(null);

  // Handler per salvare i dati dal content
  const handleContentConfirm = (data) => {
    contentDataRef.current = data;
  };

  // Handler per il confirm del modale
  const handleModalConfirm = () => {
    if (contentDataRef.current && onConfirm) {
      onConfirm(contentDataRef.current);
    }
  };

  // Handler per chiusura con reset
  const handleClose = () => {
    // Reset form data
    setHasValidData(false);
    contentDataRef.current = null;
    onClose?.();
    // Incrementa resetKey dopo la chiusura per resettare il form alla prossima apertura
    setResetKey((prev) => prev + 1);
  };

  return (
    <Modal
      title="Carica versione"
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleModalConfirm}
      confirmLabel="Carica versione"
      confirmDisabled={!hasValidData}
      zIndex={zIndex}
    >
      <div className="space-y-4">
        <VersionUploadModalContent
          key={resetKey}
          onConfirm={handleContentConfirm}
          onHasData={setHasValidData}
          existingVersions={existingVersions}
        />
      </div>
    </Modal>
  );
};

export default VersionUploadModal;
