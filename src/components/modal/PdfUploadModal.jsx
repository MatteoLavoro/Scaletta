import { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "../modal";
import { UploadIcon, CloseIcon, FileTextIcon } from "../icons";
import { validatePdfFile, formatFileSize } from "../../services/pdfs";

/**
 * PdfUploadModalContent - Contenuto interno del modale
 * Viene rimontato quando cambia resetKey per resettare lo stato
 */
const PdfUploadModalContent = ({ onUpload, onHasFiles }) => {
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

  // Processa i file selezionati
  const processFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const newErrors = [];
    const newPreviews = [];

    fileArray.forEach((file) => {
      const validation = validatePdfFile(file);
      if (validation.valid) {
        validFiles.push(file);
        newPreviews.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
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
          accept="application/pdf"
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
          {isDragging ? "Rilascia per caricare" : "Trascina i PDF qui"}
        </p>
        <p className="text-xs text-text-muted">oppure clicca per selezionare</p>
        <p className="text-xs text-text-muted mt-2">Solo PDF • Max 50MB</p>
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

      {/* Preview dei PDF selezionati */}
      {previews.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-xs font-medium text-text-secondary">
            {previews.length} PDF selezionat{previews.length === 1 ? "o" : "i"}
          </p>
          <div className="space-y-2">
            {previews.map((preview, index) => (
              <div
                key={preview.id}
                className="flex items-center gap-3 p-3 bg-bg-tertiary/50 border border-border/50 rounded-lg"
              >
                {/* Icona PDF */}
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <FileTextIcon className="w-5 h-5 text-red-500" />
                </div>

                {/* Info file */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {preview.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(preview.size)}
                  </p>
                </div>

                {/* Tasto rimuovi */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="p-2 text-text-muted hover:text-red-500 transition-colors"
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
        id="pdf-upload-confirm-btn"
        onClick={handleConfirm}
        className="hidden"
        aria-hidden="true"
      />
    </>
  );
};

/**
 * PdfUploadModal - Modale per selezionare PDF con drag & drop
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback chiusura
 * @param {function} onUpload - Callback quando si conferma (riceve array File[])
 * @param {number} zIndex - z-index personalizzato
 * @param {number} resetKey - Key per resettare lo stato del form (rimonta il contenuto)
 */
const PdfUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  zIndex,
  resetKey = 0,
}) => {
  const [hasFiles, setHasFiles] = useState(false);

  const handleConfirm = () => {
    // Trigger the hidden confirm button in the content
    document.getElementById("pdf-upload-confirm-btn")?.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Carica PDF"
      confirmText="Carica"
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmDisabled={!hasFiles}
      zIndex={zIndex}
    >
      <div className="py-2">
        {/* Key forces remount when resetKey changes, resetting all state */}
        <PdfUploadModalContent
          key={resetKey}
          onUpload={onUpload}
          onHasFiles={setHasFiles}
        />
      </div>
    </Modal>
  );
};

export default PdfUploadModal;
