import { useState, useEffect, useCallback } from "react";

// Larghezza fissa dei box
const BOX_WIDTH = 320;
// Gap tra le colonne
const GAP = 16;
// Padding laterale del container
const CONTAINER_PADDING = 32;

/**
 * Calcola il numero massimo di colonne che possono stare nella viewport
 * basandosi sulla larghezza fissa dei box
 * @param {number} viewportWidth - Larghezza viewport
 * @param {boolean} isChatOpen - Se la chat sidebar è aperta
 * @param {number} chatWidth - Larghezza della chat sidebar (default 340)
 * @returns {number} - Numero di colonne (1, 2, 3 o 4)
 */
const getColumnCount = (viewportWidth, isChatOpen = false, chatWidth = 340) => {
  // Larghezza disponibile = viewport - padding - chat (se aperta)
  let availableWidth = viewportWidth - CONTAINER_PADDING;

  // Sottrai la larghezza della chat se aperta (solo su desktop)
  if (isChatOpen && viewportWidth > 768) {
    availableWidth -= chatWidth;
  }

  // Calcola quante colonne ci stanno
  // Formula: availableWidth >= n * BOX_WIDTH + (n-1) * GAP
  // Risolviamo per n: n <= (availableWidth + GAP) / (BOX_WIDTH + GAP)
  // Aggiungiamo un margine di sicurezza di 24px per evitare situazioni limite
  const maxColumns = Math.floor(
    (availableWidth + GAP - 24) / (BOX_WIDTH + GAP),
  );

  // Limita tra 1 e 4 colonne
  return Math.max(1, Math.min(4, maxColumns));
};

/**
 * Hook per gestire il numero di colonne in modo reattivo al resize
 * Calcola le colonne in base alla larghezza fissa dei box (320px)
 * Si aggiorna dinamicamente quando la finestra viene ridimensionata
 *
 * @param {boolean} isChatOpen - Se la chat sidebar è aperta
 * @param {number} chatWidth - Larghezza della chat sidebar (default 340)
 * @returns {number} - Numero di colonne corrente (1, 2, 3 o 4)
 */
const useColumnCount = (isChatOpen = false, chatWidth = 340) => {
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === "undefined") return 3;
    return getColumnCount(window.innerWidth, isChatOpen, chatWidth);
  });

  const updateColumnCount = useCallback(() => {
    const newCount = getColumnCount(window.innerWidth, isChatOpen, chatWidth);
    setColumnCount((prev) => {
      if (prev !== newCount) return newCount;
      return prev;
    });
  }, [isChatOpen, chatWidth]);

  useEffect(() => {
    // Listener per resize senza debounce per reattività istantanea
    const handleResize = () => {
      updateColumnCount();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateColumnCount]);

  // Aggiorna le colonne quando isChatOpen cambia
  useEffect(() => {
    updateColumnCount();
  }, [isChatOpen, updateColumnCount]);

  return columnCount;
};

export { BOX_WIDTH, GAP };
export default useColumnCount;
