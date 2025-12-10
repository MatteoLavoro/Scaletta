import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "./config";

const storage = getStorage(app);

// Dimensione massima PDF: 50MB
const MAX_PDF_SIZE = 50 * 1024 * 1024;

/**
 * Genera un ID univoco per il PDF
 * @returns {string} - ID univoco
 */
const generatePdfId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Valida un file PDF
 * @param {File} file - File da validare
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validatePdfFile = (file) => {
  if (!file) {
    return { valid: false, error: "Nessun file selezionato" };
  }

  if (file.type !== "application/pdf") {
    return { valid: false, error: "Il file deve essere un PDF" };
  }

  if (file.size > MAX_PDF_SIZE) {
    return { valid: false, error: "Il PDF supera i 50MB" };
  }

  return { valid: true };
};

/**
 * Carica un PDF su Firebase Storage
 * @param {string} projectId - ID del progetto
 * @param {File} file - File da caricare
 * @param {function} onProgress - Callback per il progresso (0-100)
 * @returns {Promise<object>} - { id, url, name, size, pageCount, storagePath }
 */
export const uploadPdf = async (projectId, file, onProgress = () => {}) => {
  const pdfId = generatePdfId();
  const fileName = `${pdfId}.pdf`;
  const storageRef = ref(storage, `projects/${projectId}/pdfs/${fileName}`);

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
        console.error("Errore upload PDF:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            id: pdfId,
            url,
            name: file.name,
            size: file.size,
            type: "application/pdf",
            storagePath: `projects/${projectId}/pdfs/${fileName}`,
            // pageCount verrà aggiornato dal componente dopo il render
            pageCount: null,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Carica multipli PDF con progresso complessivo
 * @param {string} projectId - ID del progetto
 * @param {File[]} files - Array di file da caricare
 * @param {function} onProgress - Callback per il progresso totale (0-100)
 * @param {function} onPdfUploaded - Callback quando un PDF è completato
 * @returns {Promise<object[]>} - Array di PDF caricati
 */
export const uploadPdfs = async (
  projectId,
  files,
  onProgress = () => {},
  onPdfUploaded = () => {}
) => {
  const pdfs = [];
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
      const pdf = await uploadPdf(projectId, file, (progress) => {
        progressMap.set(i, progress);
        updateTotalProgress();
      });
      pdfs.push(pdf);
      completedFiles++;
      onPdfUploaded(pdf, completedFiles, totalFiles);
    } catch (error) {
      console.error(`Errore upload ${file.name}:`, error);
      // Continua con gli altri PDF
    }
  }

  return pdfs;
};

/**
 * Elimina un PDF da Firebase Storage
 * @param {string} storagePath - Path completo del PDF nello storage
 */
export const deletePdf = async (storagePath) => {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
};

/**
 * Elimina multipli PDF
 * @param {object[]} pdfs - Array di oggetti pdf con storagePath
 */
export const deletePdfs = async (pdfs) => {
  const deletePromises = pdfs.map((pdf) => {
    if (pdf.storagePath) {
      return deletePdf(pdf.storagePath).catch((err) => {
        console.error(`Errore eliminazione ${pdf.storagePath}:`, err);
      });
    }
    return Promise.resolve();
  });
  await Promise.all(deletePromises);
};

/**
 * Formatta la dimensione del file in formato leggibile
 * @param {number} bytes - Dimensione in bytes
 * @returns {string} - Dimensione formattata (es: "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};
