import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "../modal";
import { UploadIcon, CloseIcon, FolderIcon } from "../icons";
import {
  validateFile,
  formatFileSize,
  getFileType,
} from "../../services/files";

/**
 * FileUploadModalContent - Contenuto interno del modale
 * Viene rimontato quando cambia resetKey per resettare lo stato
 */
const FileUploadModalContent = ({ onConfirm, onHasFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Notify parent when files selection changes
  useEffect(() => {
    onHasFiles?.(selectedFiles.length > 0);
  }, [selectedFiles.length, onHasFiles]);

  // Processa i file selezionati
  const processFiles = useCallback(
    (files) => {
      const fileArray = Array.from(files);
      const validFiles = [];
      const newErrors = [];

      fileArray.forEach((file) => {
        const validation = validateFile(file);
        if (validation.valid) {
          // Evita duplicati
          const isDuplicate = selectedFiles.some(
            (f) => f.name === file.name && f.size === file.size
          );
          if (!isDuplicate) {
            validFiles.push(file);
          }
        } else {
          newErrors.push({ file: file.name, error: validation.error });
        }
      });

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
      if (newErrors.length > 0) {
        setErrors((prev) => [...prev, ...newErrors]);
      }
    },
    [selectedFiles]
  );

  // Handle file input change
  const handleFileSelect = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
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
      processFiles(files);
    }
  };

  // Rimuovi un file dalla selezione
  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Rimuovi un errore
  const handleRemoveError = (index) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  // Conferma selezione
  const handleConfirm = () => {
    if (selectedFiles.length > 0 && onConfirm) {
      onConfirm(selectedFiles);
    }
  };

  // Click sulla drop zone apre il file picker
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Drop Zone */}
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
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div
          className={`
            w-16 h-16 rounded-full flex items-center justify-center mb-4
            transition-colors duration-200
            ${isDragging ? "bg-primary/20" : "bg-bg-tertiary"}
          `}
        >
          <UploadIcon
            className={`w-8 h-8 ${
              isDragging ? "text-primary" : "text-text-muted"
            }`}
          />
        </div>

        <p className="text-sm font-medium text-text-primary mb-1">
          {isDragging ? "Rilascia per caricare" : "Trascina i file qui"}
        </p>
        <p className="text-xs text-text-muted">oppure clicca per selezionare</p>
        <p className="text-xs text-text-muted mt-2">Max 50MB per file</p>
      </div>

      {/* Errori */}
      {errors.length > 0 && (
        <div className="space-y-2 mt-4">
          {errors.map((err, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-red-400 truncate">
                  {err.file}
                </p>
                <p className="text-xs text-red-400/80">{err.error}</p>
              </div>
              <button
                onClick={() => handleRemoveError(index)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lista file selezionati */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-text-secondary">
            {selectedFiles.length} file selezionat
            {selectedFiles.length === 1 ? "o" : "i"}
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 bg-bg-tertiary rounded-lg p-2"
              >
                <div className="w-8 h-8 rounded bg-bg-secondary flex items-center justify-center text-text-muted">
                  <FolderIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {getFileType(file.name)} • {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="p-1.5 rounded-full hover:bg-bg-secondary text-text-muted hover:text-red-500 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden confirm handler */}
      <button
        id="file-upload-confirm-btn"
        onClick={handleConfirm}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
};

/**
 * FileUploadModal - Modale per selezionare file con drag & drop
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback chiusura
 * @param {function} onConfirm - Callback quando si conferma (riceve array File[])
 * @param {number} zIndex - z-index personalizzato
 * @param {number} resetKey - Key per resettare lo stato del form (rimonta il contenuto)
 */
const FileUploadModal = ({
  isOpen,
  onClose,
  onConfirm,
  zIndex,
  resetKey = 0,
}) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleConfirm = () => {
    // Trigger the hidden confirm button in the content
    document.getElementById("file-upload-confirm-btn")?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Carica file"
      confirmText="Conferma"
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={!hasFiles}
      zIndex={zIndex}
    >
      <div className="py-2">
        {/* Key forces remount when resetKey changes, resetting all state */}
        <FileUploadModalContent
          key={resetKey}
          onConfirm={onConfirm}
          onHasFiles={setHasFiles}
        />
      </div>
    </Modal>
  );
};

export default FileUploadModal;
