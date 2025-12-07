import { useMemo, useState, useEffect } from "react";

/**
 * Breakpoints per il numero di colonne
 * - Mobile (< 640px): 1 colonna
 * - Tablet (640px - 1023px): 2 colonne
 * - Desktop (≥ 1024px): 3 colonne
 */
const BREAKPOINTS = {
  sm: 640,
  lg: 1024,
};

/**
 * Determina il numero di colonne in base alla larghezza viewport
 * @param {number} width - Larghezza viewport
 * @returns {number} - Numero di colonne (1, 2 o 3)
 */
const getColumnCount = (width) => {
  if (width < BREAKPOINTS.sm) return 1;
  if (width < BREAKPOINTS.lg) return 2;
  return 3;
};

/**
 * Distribuisce i box nelle colonne bilanciando le altezze
 *
 * Algoritmo:
 * 1. Ordina i box per altezza decrescente (migliora bilanciamento)
 * 2. Per ogni box, trova la colonna con altezza totale minore
 * 3. Aggiungi il box a quella colonna
 *
 * @param {Array} items - Array di box con { id, height }
 * @param {number} columnCount - Numero di colonne
 * @param {number} gap - Spazio tra i box
 * @returns {Array[]} - Array di colonne, ogni colonna contiene array di box
 */
const distributeBoxes = (items, columnCount, gap) => {
  if (!items || items.length === 0) {
    return Array(columnCount)
      .fill(null)
      .map(() => []);
  }

  // Crea struttura colonne con tracciamento altezza
  const columns = Array(columnCount)
    .fill(null)
    .map(() => ({
      items: [],
      totalHeight: 0,
    }));

  // Ordina items per altezza decrescente (migliora il bilanciamento)
  const sortedItems = [...items].sort((a, b) => {
    const heightA = typeof a.height === "number" ? a.height : 200;
    const heightB = typeof b.height === "number" ? b.height : 200;
    return heightB - heightA;
  });

  // Distribuisci ogni item nella colonna più corta
  for (const item of sortedItems) {
    // Trova l'indice della colonna con altezza minore
    let shortestColumnIndex = 0;
    let minHeight = columns[0].totalHeight;

    for (let i = 1; i < columns.length; i++) {
      if (columns[i].totalHeight < minHeight) {
        minHeight = columns[i].totalHeight;
        shortestColumnIndex = i;
      }
    }

    // Aggiungi item alla colonna più corta
    const itemHeight = typeof item.height === "number" ? item.height : 200;
    columns[shortestColumnIndex].items.push(item);
    columns[shortestColumnIndex].totalHeight += itemHeight + gap;
  }

  // Ritorna solo gli array di items
  return columns.map((col) => col.items);
};

/**
 * Hook per gestire il layout Bento Box
 *
 * @param {Array} items - Array di box con { id, height, ...data }
 * @param {number} gap - Spazio tra i box in pixel (default: 16)
 * @returns {Object} - { columns, columnCount }
 */
const useBentoLayout = (items = [], gap = 16) => {
  // Stato per il numero di colonne basato su viewport
  const [columnCount, setColumnCount] = useState(() => {
    if (typeof window === "undefined") return 3;
    return getColumnCount(window.innerWidth);
  });

  // Gestione resize con debounce
  useEffect(() => {
    let timeoutId = null;

    const handleResize = () => {
      // Debounce: attendi 100ms prima di ricalcolare
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        const newColumnCount = getColumnCount(window.innerWidth);
        setColumnCount((prev) => {
          // Aggiorna solo se cambiato per evitare re-render inutili
          if (prev !== newColumnCount) return newColumnCount;
          return prev;
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Calcola distribuzione box memoizzata
  const columns = useMemo(() => {
    return distributeBoxes(items, columnCount, gap);
  }, [items, columnCount, gap]);

  return {
    columns,
    columnCount,
  };
};

export default useBentoLayout;
