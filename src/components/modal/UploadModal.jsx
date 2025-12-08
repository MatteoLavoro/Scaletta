import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "../modal";
import { UploadIcon, CloseIcon } from "../icons";
import { validateImageFile } from "../../services/photos";

/**
 * UploadModalContent - Contenuto interno del modale
 * Viene rimontato quando cambia resetKey per resettare lo stato
 */
const UploadModalContent = ({ onUpload, onHasFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Notify parent when files selection changes
  useEffect(() => {
    onHasFiles?.(selectedFiles.length > 0);
  }, [selectedFiles.length, onHasFiles]);

  // Cleanup previews URLs quando il componente si smonta
  useEffect(() => {
    const currentPreviews = previews;
    return () => {
      currentPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  // Processa i file selezionati
  const processFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const newErrors = [];
    const newPreviews = [];

    fileArray.forEach((file) => {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
        newPreviews.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
        });
      } else {
        newErrors.push({ file: file.name, error: validation.error });
      }
    });

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
    if (newErrors.length > 0) {
      setErrors((prev) => [...prev, ...newErrors]);
    }
  }, []);

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
    const toRemove = previews[index];
    if (toRemove) {
      URL.revokeObjectURL(toRemove.url);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Rimuovi un errore
  const handleRemoveError = (index) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  // Conferma upload
  const handleConfirm = () => {
    if (selectedFiles.length > 0 && onUpload) {
      onUpload(selectedFiles);
    }
  };

  // Click sulla drop zone apre il file picker
  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Formatta dimensione file
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          accept="image/jpeg,image/png,image/gif,image/webp"
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
          {isDragging ? "Rilascia per caricare" : "Trascina le foto qui"}
        </p>
        <p className="text-xs text-text-muted">oppure clicca per selezionare</p>
        <p className="text-xs text-text-muted mt-2">
          JPG, PNG, GIF, WebP • Max 10MB
        </p>
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

      {/* Preview delle foto selezionate */}
      {previews.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-text-secondary">
            {previews.length} foto selezionat{previews.length === 1 ? "a" : "e"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((preview, index) => (
              <div key={preview.id} className="relative group aspect-square">
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="w-full h-full object-cover rounded-lg"
                />
                {/* Overlay con info */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end">
                  <div className="p-2 w-full">
                    <p className="text-xs text-white truncate">
                      {preview.name}
                    </p>
                    <p className="text-xs text-white/70">
                      {formatFileSize(preview.size)}
                    </p>
                  </div>
                </div>
                {/* Tasto rimuovi */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <CloseIcon className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden confirm handler */}
      <button
        id="upload-confirm-btn"
        onClick={handleConfirm}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
};

/**
 * UploadModal - Modale per selezionare foto con drag & drop
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback chiusura
 * @param {function} onUpload - Callback quando si conferma (riceve array File[])
 * @param {number} zIndex - z-index personalizzato
 * @param {number} resetKey - Key per resettare lo stato del form (rimonta il contenuto)
 */
const UploadModal = ({ isOpen, onClose, onUpload, zIndex, resetKey = 0 }) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleConfirm = () => {
    // Trigger the hidden confirm button in the content
    document.getElementById("upload-confirm-btn")?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Carica foto"
      confirmText="Carica"
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={!hasFiles}
      zIndex={zIndex}
    >
      <div className="py-2">
        {/* Key forces remount when resetKey changes, resetting all state */}
        <UploadModalContent
          key={resetKey}
          onUpload={onUpload}
          onHasFiles={setHasFiles}
        />
      </div>
    </Modal>
  );
};

export default UploadModal;
