import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "./config";

const storage = getStorage(app);

/**
 * Genera un ID univoco per la foto
 * @returns {string} - ID univoco
 */
const generatePhotoId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Carica una foto su Firebase Storage
 * @param {string} projectId - ID del progetto
 * @param {File} file - File da caricare
 * @param {function} onProgress - Callback per il progresso (0-100)
 * @returns {Promise<object>} - { id, url, name, size, type }
 */
export const uploadPhoto = async (projectId, file, onProgress = () => {}) => {
  const photoId = generatePhotoId();
  const extension = file.name.split(".").pop();
  const fileName = `${photoId}.${extension}`;
  const storageRef = ref(storage, `projects/${projectId}/photos/${fileName}`);

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
        console.error("Errore upload foto:", error);
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            id: photoId,
            url,
            name: file.name,
            size: file.size,
            type: file.type,
            storagePath: `projects/${projectId}/photos/${fileName}`,
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Carica multiple foto con progresso complessivo
 * @param {string} projectId - ID del progetto
 * @param {File[]} files - Array di file da caricare
 * @param {function} onProgress - Callback per il progresso totale (0-100)
 * @param {function} onPhotoUploaded - Callback quando una foto è completata
 * @returns {Promise<object[]>} - Array di foto caricate
 */
export const uploadPhotos = async (
  projectId,
  files,
  onProgress = () => {},
  onPhotoUploaded = () => {}
) => {
  const photos = [];
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
      const photo = await uploadPhoto(projectId, file, (progress) => {
        progressMap.set(i, progress);
        updateTotalProgress();
      });
      photos.push(photo);
      completedFiles++;
      onPhotoUploaded(photo, completedFiles, totalFiles);
    } catch (error) {
      console.error(`Errore upload ${file.name}:`, error);
      // Continua con le altre foto
    }
  }

  return photos;
};

/**
 * Elimina una foto da Firebase Storage
 * @param {string} storagePath - Path completo della foto nello storage
 */
export const deletePhoto = async (storagePath) => {
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
};

/**
 * Elimina multiple foto
 * @param {object[]} photos - Array di oggetti foto con storagePath
 */
export const deletePhotos = async (photos) => {
  const deletePromises = photos.map((photo) => {
    if (photo.storagePath) {
      return deletePhoto(photo.storagePath).catch((err) => {
        console.error(`Errore eliminazione ${photo.storagePath}:`, err);
      });
    }
    return Promise.resolve();
  });
  await Promise.all(deletePromises);
};

/**
 * Valida un file immagine
 * @param {File} file - File da validare
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateImageFile = (file) => {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo file non supportato: ${file.type}. Usa JPG, PNG, GIF o WebP.`,
    };
  }

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File troppo grande: ${(file.size / 1024 / 1024).toFixed(
        1
      )}MB. Massimo 10MB.`,
    };
  }

  return { valid: true };
};
