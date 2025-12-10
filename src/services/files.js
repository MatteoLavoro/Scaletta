import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "./config";

const storage = getStorage(app);

// Dimensione massima file: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Genera un ID univoco per il file
 * @returns {string} - ID univoco
 */
const generateFileId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Valida un file generico
 * @param {File} file - File da validare
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: "Nessun file selezionato" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Il file supera i 50MB" };
  }

  return { valid: true };
};

/**
 * Ottiene l'estensione del file
 * @param {string} filename - Nome del file
 * @returns {string} - Estensione del file
 */
export const getFileExtension = (filename) => {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

/**
 * Ottiene il tipo di file per l'icona/display
 * @param {string} filename - Nome del file
 * @returns {string} - Tipo file (pdf, doc, xls, zip, etc.)
 */
export const getFileType = (filename) => {
  const ext = getFileExtension(filename);

  // Mappatura estensioni comuni
  const typeMap = {
    // Documenti
    pdf: "PDF",
    doc: "DOC",
    docx: "DOC",
    odt: "DOC",
    rtf: "DOC",
    txt: "TXT",
    // Fogli di calcolo
    xls: "XLS",
    xlsx: "XLS",
    csv: "CSV",
    ods: "XLS",
    // Presentazioni
    ppt: "PPT",
    pptx: "PPT",
    odp: "PPT",
    // Archivi
    zip: "ZIP",
    rar: "ZIP",
    "7z": "ZIP",
    tar: "ZIP",
    gz: "ZIP",
    // Audio
    mp3: "AUDIO",
    wav: "AUDIO",
    ogg: "AUDIO",
    m4a: "AUDIO",
    flac: "AUDIO",
    // Video
    mp4: "VIDEO",
    avi: "VIDEO",
    mkv: "VIDEO",
    mov: "VIDEO",
    webm: "VIDEO",
    // Codice
    js: "CODE",
    ts: "CODE",
    py: "CODE",
    java: "CODE",
    html: "CODE",
    css: "CODE",
    json: "CODE",
    xml: "CODE",
    // CAD
    dxf: "CAD",
    dwg: "CAD",
    dwf: "CAD",
    dgn: "CAD",
    // 3D
    step: "3D",
    stp: "3D",
    iges: "3D",
    igs: "3D",
    stl: "3D",
    obj: "3D",
    fbx: "3D",
    "3ds": "3D",
    dae: "3D",
    blend: "3D",
    skp: "3D",
    gltf: "3D",
    glb: "3D",
    usdz: "3D",
    max: "3D",
    c4d: "3D",
    ma: "3D",
    mb: "3D",
    ply: "3D",
    wrl: "3D",
    x3d: "3D",
    ifc: "3D",
    prt: "3D",
    sldprt: "3D",
    sldasm: "3D",
    catpart: "3D",
    catproduct: "3D",
    ipt: "3D",
    iam: "3D",
  };

  return typeMap[ext] || ext.toUpperCase() || "FILE";
};

/**
 * Formatta la dimensione del file in modo leggibile
 * @param {number} bytes - Dimensione in bytes
 * @returns {string} - Dimensione formattata (es. "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

/**
 * Carica un file su Firebase Storage
 * @param {string} projectId - ID del progetto
 * @param {File} file - File da caricare
 * @param {function} onProgress - Callback per il progresso (0-100)
 * @returns {Promise<object>} - { id, url, name, size, type, storagePath }
 */
export const uploadFile = async (projectId, file, onProgress = () => {}) => {
  const fileId = generateFileId();
  const extension = getFileExtension(file.name);
  const fileName = extension ? `${fileId}.${extension}` : fileId;
  const storageRef = ref(storage, `projects/${projectId}/files/${fileName}`);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress(progress);
      },
      (error) => {
        console.error("Errore upload file:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            id: fileId,
            url,
            name: file.name,
            size: file.size,
            type: file.type,
            fileType: getFileType(file.name),
            storagePath: `projects/${projectId}/files/${fileName}`,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Carica multipli file con progresso complessivo
 * @param {string} projectId - ID del progetto
 * @param {File[]} files - Array di file da caricare
 * @param {function} onProgress - Callback per il progresso totale (0-100)
 * @param {function} onFileUploaded - Callback quando un file è completato
 * @returns {Promise<object[]>} - Array di file caricati
 */
export const uploadFiles = async (
  projectId,
  files,
  onProgress = () => {},
  onFileUploaded = () => {}
) => {
  const uploadedFiles = [];
  const totalFiles = files.length;
  let completedFiles = 0;
  const progressMap = new Map();

  // Inizializza la mappa del progresso
  files.forEach((file, index) => {
    progressMap.set(index, 0);
  });

  // Calcola il progresso totale
  const updateTotalProgress = () => {
    const total = Array.from(progressMap.values()).reduce((a, b) => a + b, 0);
    const totalProgress = Math.round(total / totalFiles);
    onProgress(totalProgress);
  };

  // Upload sequenziale per evitare troppi upload simultanei
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const uploadedFile = await uploadFile(projectId, file, (progress) => {
        progressMap.set(i, progress);
        updateTotalProgress();
      });
      uploadedFiles.push(uploadedFile);
      completedFiles++;
      onFileUploaded(uploadedFile, completedFiles, totalFiles);
    } catch (error) {
      console.error(`Errore upload ${file.name}:`, error);
      // Continua con gli altri file
    }
  }

  return uploadedFiles;
};

/**
 * Elimina un file da Firebase Storage
 * @param {string} storagePath - Path completo del file nello storage
 */
export const deleteFile = async (storagePath) => {
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
};

/**
 * Elimina multipli file da Firebase Storage
 * @param {array} files - Array di file con storagePath
 */
export const deleteFiles = async (files) => {
  const deletePromises = files
    .filter((file) => file.storagePath)
    .map((file) => deleteFile(file.storagePath));

  await Promise.allSettled(deletePromises);
};

/**
 * Scarica un file (apre in nuova tab)
 * @param {string} url - URL del file
 * @param {string} filename - Nome del file
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
