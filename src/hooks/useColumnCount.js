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
 * @returns {number} - Numero di colonne (1, 2, 3 o 4)
 */
const getColumnCount = (viewportWidth) => {
  // Larghezza disponibile = viewport - padding
  const availableWidth = viewportWidth - CONTAINER_PADDING;

  // Calcola quante colonne ci stanno
  // Formula: availableWidth >= n * BOX_WIDTH + (n-1) * GAP
  // Risolviamo per n: n <= (availableWidth + GAP) / (BOX_WIDTH + GAP)
  const maxColumns = Math.floor((availableWidth + GAP) / (BOX_WIDTH + GAP));

  // Limita tra 1 e 4 colonne
  return Math.max(1, Math.min(4, maxColumns));
};

/**
 * Hook per gestire il numero di colonne in modo reattivo al resize
 * Calcola le colonne in base alla larghezza fissa dei box (320px)
 * Si aggiorna dinamicamente quando la finestra viene ridimensionata
 *
 * @returns {number} - Numero di colonne corrente (1, 2, 3 o 4)
 */
const useColumnCount = () => {
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === "undefined") return 3;
    return getColumnCount(window.innerWidth);
  });

  const updateColumnCount = useCallback(() => {
    const newCount = getColumnCount(window.innerWidth);
    setColumnCount((prev) => {
      if (prev !== newCount) return newCount;
      return prev;
    });
  }, []);

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

  return columnCount;
};

export { BOX_WIDTH, GAP };
export default useColumnCount;
