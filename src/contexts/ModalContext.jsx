import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalStack, setModalStack] = useState([]);
  // Stack di callback onClose per modali annidati (gestiti localmente, non nel modalStack)
  const nestedCloseCallbacksRef = useRef([]);

  const openModal = useCallback(
    (modalId, props = {}) => {
      setModalStack((prev) => [...prev, { id: modalId, props }]);
      document.body.classList.add("modal-open");
      window.history.pushState({ modalId, stackIndex: modalStack.length }, "");
    },
    [modalStack.length]
  );

  const closeModal = useCallback(() => {
    setModalStack((prev) => {
      const newStack = prev.slice(0, -1);
      if (newStack.length === 0) document.body.classList.remove("modal-open");
      return newStack;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModalStack([]);
    nestedCloseCallbacksRef.current = [];
    document.body.classList.remove("modal-open");
  }, []);

  // Registra una callback onClose per modali annidati
  const registerNestedClose = useCallback((callback) => {
    nestedCloseCallbacksRef.current.push(callback);
    // Ritorna una funzione per rimuovere la callback
    return () => {
      const index = nestedCloseCallbacksRef.current.indexOf(callback);
      if (index > -1) {
        nestedCloseCallbacksRef.current.splice(index, 1);
      }
    };
  }, []);

  // Chiude il modale più in alto (annidato o normale)
  const closeTopModal = useCallback(() => {
    // Se ci sono modali annidati, chiudi quello più in alto
    if (nestedCloseCallbacksRef.current.length > 0) {
      const callback = nestedCloseCallbacksRef.current.pop();
      if (callback) callback();
      return true;
    }
    // Altrimenti chiudi dal modalStack normale
    if (modalStack.length > 0) {
      closeModal();
      return true;
    }
    return false;
  }, [modalStack.length, closeModal]);

  useEffect(() => {
    const handlePopState = () => {
      // Prima prova a chiudere modali annidati, poi quelli normali
      if (nestedCloseCallbacksRef.current.length > 0) {
        const callback = nestedCloseCallbacksRef.current.pop();
        if (callback) callback();
      } else if (modalStack.length > 0) {
        closeModal();
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [modalStack.length, closeModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // Se ci sono modali annidati o normali aperti
        if (
          nestedCloseCallbacksRef.current.length > 0 ||
          modalStack.length > 0
        ) {
          e.preventDefault();
          // Se ci sono modali annidati, chiudili direttamente senza history.back()
          if (nestedCloseCallbacksRef.current.length > 0) {
            const callback = nestedCloseCallbacksRef.current.pop();
            if (callback) callback();
          } else {
            window.history.back();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalStack.length]);

  const currentModal = modalStack[modalStack.length - 1] || null;
  // Numero di modali aperti (per gestire z-index e blur)
  const modalDepth = modalStack.length;

  return (
    <ModalContext.Provider
      value={{
        currentModal,
        modalStack,
        modalDepth,
        openModal,
        closeModal,
        closeAllModals,
        closeTopModal,
        registerNestedClose,
        isModalOpen: (modalId) => modalStack.some((m) => m.id === modalId),
        getModalIndex: (modalId) =>
          modalStack.findIndex((m) => m.id === modalId),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
};
