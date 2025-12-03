import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalStack, setModalStack] = useState([]);

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
    document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (modalStack.length > 0) closeModal();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [modalStack.length, closeModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && modalStack.length > 0) {
        e.preventDefault();
        window.history.back();
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
