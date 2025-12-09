import { useState, useRef, useEffect, useCallback } from "react";
import { useModal } from "../../contexts/ModalContext";
import { ArrowLeftIcon, CameraIcon, CheckIcon, CloseIcon } from "../icons";

/**
 * CameraModal - Modale fullscreen per scattare foto con la fotocamera
 *
 * Flusso:
 * 1. Apre la fotocamera posteriore del dispositivo
 * 2. L'utente scatta una foto
 * 3. Mostra l'anteprima con tasti conferma/riprova
 * 4. Su conferma, ritorna il file immagine
 *
 * @param {boolean} isOpen - Se il modale è aperto
 * @param {function} onClose - Callback per chiudere il modale
 * @param {function} onConfirm - Callback con il file immagine (File)
 */
const CameraModal = ({ isOpen, onClose, onConfirm }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const hasAddedHistoryRef = useRef(false);
  const isOpenRef = useRef(isOpen);
  const { registerNestedClose } = useModal();

  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  // Mantieni ref sincronizzato con prop tramite effect
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Ferma la fotocamera (senza setState)
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Ferma la fotocamera (con setState - per uso da event handlers)
  const stopCamera = useCallback(() => {
    stopCameraStream();
    setCameraReady(false);
  }, [stopCameraStream]);

  // Avvia la fotocamera (chiamato solo da user action o timer)
  const initCamera = useCallback(async () => {
    if (!isOpenRef.current) return;

    try {
      // Ferma lo stream precedente se esiste
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: "environment", // fotocamera posteriore
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Verifica che il modale sia ancora aperto
      if (!isOpenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
      setCameraReady(true);
      setError(null);
    } catch (err) {
      console.error("Errore accesso fotocamera:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Permesso fotocamera negato. Consenti l'accesso alla fotocamera nelle impostazioni."
          : "Impossibile accedere alla fotocamera. Verifica che il dispositivo abbia una fotocamera."
      );
      setIsLoading(false);
    }
  }, []);

  // Effect per avviare/fermare la fotocamera
  useEffect(() => {
    let timer;
    if (isOpen) {
      // Reset state e avvia con un piccolo delay per evitare cascading renders
      timer = setTimeout(() => {
        setCapturedImage(null);
        setError(null);
        setIsLoading(true);
        initCamera();
      }, 50);
    } else {
      // Usa stopCameraStream invece di stopCamera per evitare setState nell'effect
      stopCameraStream();
      hasAddedHistoryRef.current = false;
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopCameraStream();
    };
  }, [isOpen, initCamera, stopCameraStream]);

  // Gestione history browser
  useEffect(() => {
    if (isOpen && onClose) {
      if (!hasAddedHistoryRef.current) {
        window.history.pushState({ cameraModal: true }, "");
        hasAddedHistoryRef.current = true;
      }

      const unregister = registerNestedClose(onClose);
      return unregister;
    }
  }, [isOpen, onClose, registerNestedClose]);

  // Chiusura con history.back()
  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  // Scatta la foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Imposta le dimensioni del canvas uguali al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Disegna il frame corrente sul canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converti in data URL per l'anteprima
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);

    // Ferma la fotocamera mentre mostriamo l'anteprima
    stopCamera();
  }, [stopCamera]);

  // Riprova - torna alla fotocamera
  const handleRetry = useCallback(() => {
    setCapturedImage(null);
    setIsLoading(true);
    // Avvia con delay per evitare cascading
    setTimeout(() => {
      initCamera();
    }, 50);
  }, [initCamera]);

  // Conferma - converte l'immagine in File e chiama onConfirm
  const handleConfirm = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) return;

    try {
      // Converti il canvas in Blob
      const blob = await new Promise((resolve) => {
        canvasRef.current.toBlob(resolve, "image/jpeg", 0.9);
      });

      // Crea un File dal Blob
      const fileName = `foto_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });

      // Chiudi il modale e passa il file
      handleClose();

      // Callback con il file
      if (onConfirm) {
        onConfirm(file);
      }
    } catch (err) {
      console.error("Errore creazione file:", err);
      setError("Errore nel salvare la foto. Riprova.");
    }
  }, [capturedImage, onConfirm, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-1010 bg-black flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Fotocamera"
    >
      {/* Canvas nascosto per catturare la foto */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header con tasto chiudi */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 active:bg-black/80 transition-colors"
          aria-label="Chiudi fotocamera"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Area principale - Video o Anteprima */}
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        {/* Loading */}
        {isLoading && !capturedImage && (
          <div className="flex flex-col items-center gap-4 text-white">
            <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Avvio fotocamera...</span>
          </div>
        )}

        {/* Errore */}
        {error && !capturedImage && (
          <div className="flex flex-col items-center gap-4 text-white text-center px-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <CameraIcon className="w-8 h-8 text-red-400" />
            </div>
            <span className="text-sm">{error}</span>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Video della fotocamera */}
        {!capturedImage && !error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Anteprima foto scattata */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Foto scattata"
            className="w-full h-full object-contain"
          />
        )}
      </main>

      {/* Footer con controlli */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 p-6 pb-safe">
        {/* Stato: Fotocamera attiva - Mostra tasto scatto */}
        {!capturedImage && !error && cameraReady && (
          <div className="flex items-center justify-center">
            <button
              onClick={capturePhoto}
              className="
                w-20 h-20 rounded-full
                bg-white
                border-4 border-white/30
                flex items-center justify-center
                hover:scale-105 active:scale-95
                transition-transform duration-150
                shadow-lg
              "
              aria-label="Scatta foto"
            >
              <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200" />
            </button>
          </div>
        )}

        {/* Stato: Anteprima - Mostra tasti conferma/riprova */}
        {capturedImage && (
          <div className="flex items-center justify-center gap-8">
            {/* Riprova */}
            <button
              onClick={handleRetry}
              className="
                w-16 h-16 rounded-full
                bg-white/10 backdrop-blur-sm
                border-2 border-white/30
                flex items-center justify-center
                text-white
                hover:bg-white/20 active:bg-white/30
                transition-colors duration-150
              "
              aria-label="Scatta di nuovo"
            >
              <CloseIcon className="w-7 h-7" />
            </button>

            {/* Conferma */}
            <button
              onClick={handleConfirm}
              className="
                w-20 h-20 rounded-full
                bg-primary
                flex items-center justify-center
                text-white
                hover:opacity-90 active:opacity-80
                transition-opacity duration-150
                shadow-lg
              "
              aria-label="Conferma foto"
            >
              <CheckIcon className="w-10 h-10" />
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default CameraModal;
