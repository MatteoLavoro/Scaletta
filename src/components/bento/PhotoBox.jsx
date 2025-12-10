import { useState, useRef, useEffect, useCallback } from "react";
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  TrashIcon,
} from "../icons";
import BaseBentoBox from "./BaseBentoBox";
import { UploadModal, ConfirmModal, ImageModal } from "../modal";
import { uploadPhotos, deletePhoto } from "../../services/photos";

// Altezza fissa del carosello
const CAROUSEL_HEIGHT = 200;

/**
 * Hook per precaricare immagini in background
 * @param {array} photos - Array di foto da precaricare
 * @returns {Set} - Set di URL già caricati
 */
const useImagePreload = (photos) => {
  const [loadedUrls, setLoadedUrls] = useState(new Set());
  const loadingRef = useRef(new Set());

  useEffect(() => {
    if (!photos || photos.length === 0) return;

    photos.forEach((photo) => {
      if (
        photo?.url &&
        !loadedUrls.has(photo.url) &&
        !loadingRef.current.has(photo.url)
      ) {
        loadingRef.current.add(photo.url);
        const img = new Image();
        img.onload = () => {
          setLoadedUrls((prev) => new Set([...prev, photo.url]));
        };
        img.src = photo.url;
      }
    });
  }, [photos, loadedUrls]);

  return loadedUrls;
};

// Ref condiviso per l'indice corrente dell'ImageModal (usato per sincronizzare dopo delete)
// Questo è un workaround per comunicare l'indice corrente tra ImageModal e PhotoBox

/**
 * PhotoBox - Bento Box per le foto
 *
 * Box specializzato per contenere una o più foto.
 * Ha un carosello per scorrere tra le foto.
 * Supporta upload di multiple foto con drag & drop.
 *
 * @param {string} projectId - ID del progetto (per upload)
 * @param {string} title - Titolo del box
 * @param {array} photos - Array di foto { id, url, name, storagePath }
 * @param {boolean} isPinned - Se il box è fissato in alto
 * @param {function} onPinToggle - Callback quando si clicca sul pin
 * @param {function} onTitleChange - Callback per cambiare il titolo
 * @param {function} onPhotosChange - Callback quando cambiano le foto
 * @param {function} onDelete - Callback per eliminare il box
 */
const PhotoBox = ({
  projectId,
  title = "Foto",
  photos = [],
  isPinned = false,
  onPinToggle,
  onTitleChange,
  onPhotosChange,
  onDelete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadResetKey, setUploadResetKey] = useState(0);
  // Upload in background direttamente nel box
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeletePhotoConfirmOpen, setIsDeletePhotoConfirmOpen] =
    useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  // Stato per visualizzazione fullscreen
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  // Ref per tracciare l'indice corrente nell'ImageModal (aggiornato via onIndexChange)
  const currentImageIndexRef = useRef(0);

  // Precarica tutte le immagini per scrolling fluido
  const loadedUrls = useImagePreload(photos);

  // Touch/swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Mantieni l'indice valido quando cambiano le foto
  useEffect(() => {
    if (currentIndex >= photos.length && photos.length > 0) {
      setCurrentIndex(photos.length - 1);
    }
  }, [photos.length, currentIndex]);

  // Navigazione carosello
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Touch handlers per swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Upload photos - chiude subito il modale, upload in background
  const handleUpload = async (files) => {
    if (!projectId || files.length === 0) return;

    // Chiudi subito il modale
    setIsUploadModalOpen(false);
    setUploadResetKey((k) => k + 1);

    // Inizia upload in background nel box
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const currentPhotosLength = photos.length;
      const uploadedPhotos = await uploadPhotos(
        projectId,
        files,
        (progress) => setUploadProgress(progress),
        () => {} // onPhotoUploaded
      );

      if (uploadedPhotos.length > 0 && onPhotosChange) {
        onPhotosChange([...photos, ...uploadedPhotos]);
        // Vai all'ultima foto caricata
        setCurrentIndex(currentPhotosLength + uploadedPhotos.length - 1);
      }
    } catch (error) {
      console.error("Errore upload foto:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Apri conferma eliminazione foto
  const handleDeletePhotoClick = () => {
    if (photos.length > 0 && photos[currentIndex]) {
      setPhotoToDelete(photos[currentIndex]);
      setIsDeletePhotoConfirmOpen(true);
    }
  };

  // Elimina foto confermata
  const handleDeletePhotoConfirm = async () => {
    if (!photoToDelete) return;

    try {
      // Elimina dallo storage
      if (photoToDelete.storagePath) {
        await deletePhoto(photoToDelete.storagePath);
      }

      // Aggiorna array foto
      const newPhotos = photos.filter((p) => p.id !== photoToDelete.id);
      if (onPhotosChange) {
        onPhotosChange(newPhotos);
      }

      setIsDeletePhotoConfirmOpen(false);
      setPhotoToDelete(null);

      // Se non ci sono più foto, chiudi l'ImageModal
      if (newPhotos.length === 0) {
        setIsImageModalOpen(false);
      } else {
        // Aggiorna l'indice per mostrare l'immagine successiva (o precedente se era l'ultima)
        const deletedIndex = currentImageIndexRef.current;
        const newIndex =
          deletedIndex >= newPhotos.length
            ? newPhotos.length - 1
            : deletedIndex;
        setImageModalIndex(newIndex);
        currentImageIndexRef.current = newIndex;
      }
    } catch (error) {
      console.error("Errore eliminazione foto:", error);
    }
  };

  // Menu items specifici per PhotoBox
  const photoMenuItems =
    photos.length > 0
      ? [
          {
            label: "Aggiungi foto",
            icon: <PlusIcon className="w-5 h-5" />,
            onClick: () => {
              setUploadResetKey((k) => k + 1);
              setIsUploadModalOpen(true);
            },
          },
          {
            label: "Elimina questa foto",
            icon: <TrashIcon className="w-5 h-5" />,
            onClick: handleDeletePhotoClick,
            danger: true,
          },
        ]
      : [];

  const hasPhotos = photos.length > 0;

  return (
    <>
      <BaseBentoBox
        title={title}
        badgeCount={hasPhotos ? photos.length : null}
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onTitleChange={onTitleChange}
        onDelete={onDelete}
        menuItems={photoMenuItems}
        minHeight={hasPhotos ? undefined : 150}
      >
        {hasPhotos ? (
          // Carosello foto
          <div className="relative">
            {/* Container foto */}
            <div
              className="relative overflow-hidden rounded-lg bg-black"
              style={{ height: `${CAROUSEL_HEIGHT}px` }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Preload immagini adiacenti (nascoste) */}
              {photos.map(
                (photo, idx) =>
                  idx !== currentIndex && (
                    <img
                      key={photo.id}
                      src={photo.url}
                      alt=""
                      className="hidden"
                      aria-hidden="true"
                    />
                  )
              )}

              {/* Immagine corrente - transizione fluida */}
              <img
                src={photos[currentIndex]?.url}
                alt={photos[currentIndex]?.name || `Foto ${currentIndex + 1}`}
                className={`w-full h-full object-contain transition-opacity duration-150 cursor-pointer ${
                  loadedUrls.has(photos[currentIndex]?.url)
                    ? "opacity-100"
                    : "opacity-0"
                }`}
                onClick={() => {
                  setImageModalIndex(currentIndex);
                  setIsImageModalOpen(true);
                }}
              />

              {/* Loader mentre l'immagine carica */}
              {!loadedUrls.has(photos[currentIndex]?.url) && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Frecce navigazione (solo se più di 1 foto) */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-white" />
                  </button>
                </>
              )}

              {/* Counter in alto a destra */}
              {photos.length > 1 && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-full text-xs text-white">
                  {currentIndex + 1} / {photos.length}
                </div>
              )}
            </div>

            {/* Indicatori (pallini) sotto la foto */}
            {photos.length > 1 && photos.length <= 10 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-primary w-4"
                        : "bg-text-muted/30 hover:bg-text-muted/50"
                    }`}
                    aria-label={`Vai alla foto ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Barra di progresso upload (quando upload in corso) */}
            {isUploading && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                  <span>Caricamento...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : // Stato vuoto - tasto per aggiungere foto oppure upload in corso
        isUploading ? (
          <div className="w-full py-6 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="w-full max-w-[200px]">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>Caricamento...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
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
              <ImageIcon className="w-7 h-7" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Aggiungi foto</p>
              <p className="text-xs text-text-muted/70 mt-0.5">
                Tocca per caricare
              </p>
            </div>
          </button>
        )}
      </BaseBentoBox>

      {/* Modale upload - si chiude subito dopo l'invio */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        resetKey={uploadResetKey}
      />

      {/* Conferma eliminazione foto */}
      {/* Conferma eliminazione foto - skipHistory per non interferire con ImageModal */}
      <ConfirmModal
        isOpen={isDeletePhotoConfirmOpen}
        title="Elimina foto"
        message="Sei sicuro di voler eliminare questa foto? L'azione non può essere annullata."
        confirmText="Elimina"
        danger
        zIndex={2100}
        skipHistory={true}
        onConfirm={handleDeletePhotoConfirm}
        onCancel={() => {
          setIsDeletePhotoConfirmOpen(false);
          setPhotoToDelete(null);
        }}
      />

      {/* Modale immagine fullscreen */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={photos}
        initialIndex={imageModalIndex}
        onIndexChange={(index) => {
          currentImageIndexRef.current = index;
        }}
        onDelete={(photo, currentIndex) => {
          // NON chiudere l'ImageModal - apri il ConfirmModal sopra
          currentImageIndexRef.current = currentIndex;
          setPhotoToDelete(photo);
          setIsDeletePhotoConfirmOpen(true);
        }}
      />
    </>
  );
};

export default PhotoBox;
