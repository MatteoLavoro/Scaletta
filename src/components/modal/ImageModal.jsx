import { useEffect, useCallback, useState, useRef } from "react";
import {
  ArrowLeftIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  RotateCwIcon,
  TrashIcon,
} from "../icons";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useModal } from "../../contexts/ModalContext";

/**
 * Hook per precaricare immagini adiacenti
 */
const useImagePreload = (images, currentIndex) => {
  const preloadedRef = useRef(new Set());

  useEffect(() => {
    if (!images || images.length === 0) return;

    // Precarica immagine corrente + precedente + successiva
    const indicesToPreload = [
      currentIndex,
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
    ];

    indicesToPreload.forEach((idx) => {
      const url = images[idx]?.url;
      if (url && !preloadedRef.current.has(url)) {
        preloadedRef.current.add(url);
        const img = new Image();
        img.src = url;
      }
    });
  }, [images, currentIndex]);
};

/**
 * ImageModalContent - Contenuto interno del modale
 */
const ImageModalContent = ({
  images,
  initialIndex,
  onRequestDelete,
  isMobile,
  handleClose,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  // Precarica immagini adiacenti
  useImagePreload(images, currentIndex);

  // Notifica il parent quando cambia l'indice
  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  // Navigazione
  const goToPrevious = useCallback(() => {
    setIsLoaded(false);
    setRotation(0);
    rotationRef.current = 0;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setIsLoaded(false);
    setRotation(0);
    rotationRef.current = 0;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Ruota immagine di 90 gradi in senso orario
  const handleRotate = useCallback(() => {
    rotationRef.current += 90;
    setRotation(rotationRef.current);
  }, []);

  // Gestione tastiera
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          if (images.length > 1) goToPrevious();
          break;
        case "ArrowRight":
          if (images.length > 1) goToNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, goToPrevious, goToNext, images.length]);

  // Download immagine
  const handleDownload = async (e) => {
    e.stopPropagation();
    const image = images[currentIndex];
    if (!image?.url) return;

    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.name || `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Errore download immagine:", error);
      window.open(image.url, "_blank");
    }
  };

  // Elimina immagine corrente
  const handleDelete = (e) => {
    e.stopPropagation();
    const image = images[currentIndex];
    if (image && onRequestDelete) {
      onRequestDelete(image, currentIndex);
    }
  };

  // Chiudi cliccando sul backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const currentImage = images[currentIndex];
  const isRotated90or270 = rotation % 180 !== 0;
  const hasMultipleImages = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-2000 bg-black flex flex-col"
      onClick={handleBackdropClick}
    >
      {/* Header */}
      <div className="shrink-0 h-16 flex items-center justify-between px-4 z-10">
        {/* Sinistra: Back button (mobile) / Spacer (desktop) */}
        {isMobile ? (
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Torna indietro"
          >
            <ArrowLeftIcon className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}

        {/* Centro: Toolbar in pillola */}
        <div className="flex items-center gap-1 px-2 py-1.5 bg-white/10 rounded-full backdrop-blur-sm">
          {/* Counter */}
          {hasMultipleImages && (
            <>
              <span className="px-2 text-sm text-white font-medium">
                {currentIndex + 1}/{images.length}
              </span>
              <div className="w-px h-5 bg-white/20" />
            </>
          )}

          {/* Ruota */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotate();
            }}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Ruota immagine"
          >
            <RotateCwIcon className="w-5 h-5 text-white" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            aria-label="Scarica immagine"
          >
            <DownloadIcon className="w-5 h-5 text-white" />
          </button>

          {/* Elimina */}
          {onRequestDelete && (
            <>
              <div className="w-px h-5 bg-white/20" />
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-full hover:bg-red-500/20 flex items-center justify-center transition-colors"
                aria-label="Elimina immagine"
              >
                <TrashIcon className="w-5 h-5 text-red-400" />
              </button>
            </>
          )}
        </div>

        {/* Destra: Close button (desktop) / Spacer (mobile) */}
        {!isMobile ? (
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Chiudi"
          >
            <CloseIcon className="w-6 h-6 text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Immagine */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4">
        {/* Loader */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <img
          src={currentImage?.url}
          alt={currentImage?.name || `Immagine ${currentIndex + 1}`}
          className={`transition-all duration-300 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${
            isRotated90or270
              ? "max-h-[100vw] max-w-[100vh]"
              : "max-w-full max-h-full"
          } object-contain`}
          style={{ transform: `rotate(${rotation}deg)` }}
          onLoad={() => setIsLoaded(true)}
          draggable={false}
        />

        {/* Frecce navigazione */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Immagine precedente"
            >
              <ChevronLeftIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="Immagine successiva"
            >
              <ChevronRightIcon className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Footer con nome file */}
      {currentImage?.name && (
        <div className="shrink-0 py-4 flex justify-center">
          <div className="px-4 py-2 bg-white/10 rounded-full max-w-[90%] backdrop-blur-sm">
            <p className="text-sm text-white truncate">{currentImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ImageModal - Modale per visualizzare immagini a schermo intero
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback per chiudere il modale
 * @param {array} images - Array di immagini { id, url, name }
 * @param {number} initialIndex - Indice iniziale dell'immagine da visualizzare
 * @param {function} onDelete - Callback per eliminare un'immagine (opzionale)
 * @param {function} onIndexChange - Callback quando cambia l'indice corrente (opzionale)
 */
const ImageModal = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  onDelete,
  onIndexChange,
}) => {
  const isMobile = useIsMobile();
  const hasAddedHistoryRef = useRef(false);
  const { registerNestedClose } = useModal();

  // Chiude il modale via history.back()
  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  // Gestione history per back button
  useEffect(() => {
    if (isOpen && onClose) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ imageModal: true }, "");
        hasAddedHistoryRef.current = true;
      }

      const unregister = registerNestedClose(onClose);
      return unregister;
    }

    if (!isOpen) {
      hasAddedHistoryRef.current = false;
    }
  }, [isOpen, onClose, registerNestedClose]);

  // Blocca scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  return (
    <ImageModalContent
      key={`${initialIndex}-${isOpen}`}
      images={images}
      initialIndex={initialIndex}
      onDelete={onDelete}
      onRequestDelete={onDelete}
      isMobile={isMobile}
      handleClose={handleClose}
      onIndexChange={onIndexChange}
    />
  );
};

export default ImageModal;
