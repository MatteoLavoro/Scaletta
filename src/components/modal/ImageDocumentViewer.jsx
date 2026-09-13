import { useEffect, useCallback, useState, useRef } from "react";
import DocumentViewerModal from "./DocumentViewerModal";

/**
 * Hook per precaricare immagini adiacenti (corrente + precedente + successiva)
 */
const useImagePreload = (images, currentIndex) => {
  const preloadedRef = useRef(new Set());

  useEffect(() => {
    if (!images || images.length === 0) return;

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
 * ImageDocumentViewer - Visualizzatore fullscreen di immagini.
 *
 * Estende DocumentViewerModal (composition) attivando le feature
 * "rotazione", "download" ed "elimina", disattivando invece "zoom" e
 * "sidebar" (non pertinenti per singole immagini).
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {array} images - Array di immagini { id, url, name }
 * @param {number} initialIndex
 * @param {function} onDelete - Callback per eliminare un'immagine (opzionale)
 * @param {function} onIndexChange - Callback quando cambia l'indice corrente
 */
const ImageDocumentViewer = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  onDelete,
  onIndexChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [rotationByIndex, setRotationByIndex] = useState({});
  const [loadedIndex, setLoadedIndex] = useState(null);

  useImagePreload(images, currentIndex);

  const handleIndexChange = useCallback(
    (index) => {
      setCurrentIndex(index);
      setLoadedIndex(null);
      onIndexChange?.(index);
    },
    [onIndexChange],
  );

  const handleRotate = useCallback(() => {
    setRotationByIndex((prev) => ({
      ...prev,
      [currentIndex]: ((prev[currentIndex] || 0) + 90) % 360,
    }));
  }, [currentIndex]);

  const handleDownload = useCallback(async (image) => {
    if (!image?.url) return;
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.name || "immagine.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Errore download immagine:", error);
      window.open(image.url, "_blank");
    }
  }, []);

  const renderContent = useCallback(
    (image, index) => {
      const rotation = rotationByIndex[index] || 0;
      const isRotated90or270 = rotation % 180 !== 0;
      const isLoaded = loadedIndex === index;

      return (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden px-4">
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {image?.url && (
            <img
              key={image.url}
              src={image.url}
              alt={image.name || "Immagine"}
              onLoad={() => setLoadedIndex(index)}
              draggable={false}
              className={`transition-opacity duration-200 select-none ${
                isLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{
                maxWidth: isRotated90or270 ? "90vh" : "100%",
                maxHeight: isRotated90or270 ? "90vw" : "100%",
                objectFit: "contain",
                transform: `rotate(${rotation}deg)`,
                transition: "transform 0.3s ease, opacity 0.2s ease",
              }}
            />
          )}
        </div>
      );
    },
    [rotationByIndex, loadedIndex],
  );

  if (!isOpen || images.length === 0) return null;

  return (
    <DocumentViewerModal
      isOpen={isOpen}
      onClose={onClose}
      documents={images}
      initialIndex={initialIndex}
      onIndexChange={handleIndexChange}
      renderContent={renderContent}
      showRotate
      onRotate={handleRotate}
      showDownload
      onDownload={handleDownload}
      showDelete={!!onDelete}
      onDelete={onDelete}
      showZoom={false}
      showSidebar={false}
    />
  );
};

export default ImageDocumentViewer;
