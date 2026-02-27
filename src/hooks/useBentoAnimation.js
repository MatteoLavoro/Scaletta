import {
  useRef,
  useLayoutEffect,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

/**
 * Hook per gestire il layout Bento con distribuzione "shortest column first"
 * e animazioni FLIP per le transizioni
 *
 * Algoritmo di distribuzione:
 * - Ogni box viene assegnato alla colonna più corta al momento dell'assegnazione
 * - Quando un box cambia altezza, si ricalcolano le assegnazioni ottimali
 * - Le transizioni vengono animate con tecnica FLIP
 *
 * NUOVO SISTEMA:
 * - Calcolo posizioni in background prima di animare
 * - Solo i box che cambiano posizione vengono animati
 * - I box che non si muovono rimangono fermi (no animazione)
 *
 * @param {Array} items - Array di elementi con id univoci
 * @param {number} columnCount - Numero di colonne
 * @param {number} gap - Gap tra i box (default: 16)
 * @returns {Object} - { containerRef, columns, getItemStyle }
 */
const useBentoAnimation = (items, columnCount, gap = 16) => {
  const containerRef = useRef(null);
  const targetPositionsRef = useRef(new Map()); // Posizioni target salvate per FLIP
  const heightsRef = useRef(new Map());
  const isFirstRenderRef = useRef(true);
  const animatingRef = useRef(new Set());
  const resizeObserverRef = useRef(null);
  const [heights, setHeights] = useState(new Map());
  // Ref per tracciare gli ID del ciclo precedente (per identificare nuovi elementi PRIMA del render)
  const prevItemIdsRef = useRef(new Set());
  // Set di ID degli elementi che stanno facendo fade-in (gestito dal useLayoutEffect)
  const [fadingInIds, setFadingInIds] = useState(() => new Set());
  // Traccia il columnCount precedente per rilevare cambiamenti
  const prevColumnCountRef = useRef(columnCount);
  // Flag per indicare che stiamo calcolando nuove posizioni
  const isCalculatingRef = useRef(false);
  // Flag per indicare che le nuove posizioni sono pronte per essere applicate
  const isReadyToAnimateRef = useRef(false);

  // Crea una chiave unica basata sugli items per rilevare cambiamenti nel contenuto
  const itemsKey = useMemo(() => {
    return items
      .map((item) => `${item.id}:${item.content || ""}:${item.title || ""}`)
      .join("|");
  }, [items]);

  // Identifica gli ID nuovi PRIMA del render confrontando con il ciclo precedente
  // Questo permette a getItemStyle di nasconderli immediatamente
  const newItemIds = useMemo(() => {
    const currentIds = new Set(items.map((item) => item.id));
    const prevIds = prevItemIdsRef.current;

    // Trova gli ID che sono in currentIds ma non in prevIds
    const newIds = new Set();
    // Non considerare nuovi al primo render (quando prevIds è vuoto)
    if (prevIds.size > 0) {
      currentIds.forEach((id) => {
        if (!prevIds.has(id)) {
          newIds.add(id);
        }
      });
    }

    // Aggiorna il ref per il prossimo ciclo
    prevItemIdsRef.current = currentIds;

    return newIds;
  }, [items]);

  // Funzione per misurare le altezze di tutti i box
  const measureHeights = useCallback(() => {
    if (!containerRef.current) return new Map();

    const elements = containerRef.current.querySelectorAll("[data-bento-id]");
    const newHeights = new Map();
    let hasChanges = false;

    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      // Usa scrollHeight per avere l'altezza reale del contenuto
      const height = el.offsetHeight;
      newHeights.set(id, height);

      if (heightsRef.current.get(id) !== height) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      heightsRef.current = newHeights;
      setHeights(new Map(newHeights));
    }

    return newHeights;
  }, []);

  // Distribuisci i box nelle colonne usando "shortest column first"
  const columns = useMemo(() => {
    if (!items || items.length === 0) {
      return Array(columnCount)
        .fill(null)
        .map(() => []);
    }

    // Inizializza colonne con tracciamento altezza
    const cols = Array(columnCount)
      .fill(null)
      .map(() => ({
        items: [],
        totalHeight: 0,
      }));

    // Altezze stimate per tipo di box (per calcolo iniziale più accurato)
    const ESTIMATED_HEIGHTS = {
      tutorial: 200,
      add: 320, // AddBentoBoxButton è quadrato
      note: 180,
      photo: 280, // PhotoBox con carousel
      generic: 200,
    };
    const DEFAULT_HEIGHT = 200;

    // Distribuisci ogni item nella colonna più corta
    // Manteniamo l'ordine originale degli items
    items.forEach((item) => {
      // Trova la colonna più corta
      let shortestIndex = 0;
      let minHeight = cols[0].totalHeight;

      for (let i = 1; i < columnCount; i++) {
        if (cols[i].totalHeight < minHeight) {
          minHeight = cols[i].totalHeight;
          shortestIndex = i;
        }
      }

      // Ottieni l'altezza misurata, o usa altezza stimata per tipo, o default
      const measuredHeight = heights.get(item.id);
      const estimatedHeight =
        ESTIMATED_HEIGHTS[item.type] ||
        ESTIMATED_HEIGHTS[item.boxType] ||
        DEFAULT_HEIGHT;
      const itemHeight = measuredHeight || estimatedHeight;

      // Aggiungi alla colonna più corta
      cols[shortestIndex].items.push(item);
      cols[shortestIndex].totalHeight += itemHeight + gap;
    });

    // Ritorna solo gli items per colonna
    return cols.map((col) => col.items);
  }, [items, columnCount, heights, gap]);

  // Calcola le posizioni target per ogni box (in background, senza applicarle al DOM)
  const calculateTargetPositions = useCallback(() => {
    if (!columns || columns.length === 0) return new Map();

    const positions = new Map();
    const columnTops = Array(columnCount).fill(0);

    const ESTIMATED_HEIGHTS = {
      tutorial: 200,
      add: 320,
      note: 180,
      photo: 280,
      generic: 200,
    };
    const DEFAULT_HEIGHT = 200;

    columns.forEach((colItems, colIndex) => {
      colItems.forEach((item) => {
        const measuredHeight = heights.get(item.id);
        const estimatedHeight =
          ESTIMATED_HEIGHTS[item.type] ||
          ESTIMATED_HEIGHTS[item.boxType] ||
          DEFAULT_HEIGHT;
        const itemHeight = measuredHeight || estimatedHeight;

        positions.set(item.id, {
          columnIndex: colIndex,
          top: columnTops[colIndex],
        });

        columnTops[colIndex] += itemHeight + gap;
      });
    });

    return positions;
  }, [columns, columnCount, heights, gap]);

  // Setup ResizeObserver per rilevare cambiamenti di altezza
  useEffect(() => {
    if (!containerRef.current) return;

    // Misura iniziale dopo il mount
    const initialMeasure = () => {
      measureHeights();
    };
    requestAnimationFrame(initialMeasure);

    // Observer per cambiamenti di dimensione
    resizeObserverRef.current = new ResizeObserver((entries) => {
      // Controlla se qualche altezza è effettivamente cambiata
      let hasHeightChange = false;
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("data-bento-id");
        const currentHeight = heightsRef.current.get(id);
        const newHeight = entry.contentRect.height;
        if (Math.abs((currentHeight || 0) - newHeight) > 2) {
          hasHeightChange = true;
        }
      });

      if (hasHeightChange) {
        measureHeights();
      }
    });

    // Osserva tutti i box
    const elements = containerRef.current.querySelectorAll("[data-bento-id]");
    elements.forEach((el) => {
      resizeObserverRef.current.observe(el);
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [items, measureHeights]);

  // Rileva cambiamenti di columnCount per trigger ricalcolo
  useEffect(() => {
    if (prevColumnCountRef.current !== columnCount) {
      // ColumnCount è cambiato (chat aperta/chiusa o resize)
      isCalculatingRef.current = true;

      prevColumnCountRef.current = columnCount;

      // Aspetta che il container si sia stabilizzato (transizione CSS completata)
      const timer = setTimeout(() => {
        isCalculatingRef.current = false;
        isReadyToAnimateRef.current = true;
      }, 50); // Breve delay per stabilità

      return () => clearTimeout(timer);
    }
  }, [columnCount]);

  // useLayoutEffect per animazioni FLIP con calcolo posizioni in background
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Skip animazione al primo render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      containerRef.current.offsetHeight;
      // Salva le posizioni iniziali (FIRST delle prossime animazioni)
      targetPositionsRef.current = calculateTargetPositions();
      return;
    }

    // Skip se stiamo ancora calcolando (durante transizione container)
    if (isCalculatingRef.current) {
      return;
    }

    // TECNICA FLIP CORRETTA:
    // FIRST: usa le posizioni target salvate dal ciclo precedente (dove ERANO i box)
    const firstPositions = targetPositionsRef.current;

    // LAST: calcola le nuove posizioni target (dove DEVONO ANDARE i box)
    const lastPositions = calculateTargetPositions();

    // FASE 1: Determina quali box devono essere animati confrontando first e last
    const boxesToAnimate = new Map(); // id -> { deltaX, deltaY }

    // Ottieni dimensioni container per conversioni
    const containerRect = containerRef.current.getBoundingClientRect();
    const BOX_WIDTH = columnCount === 1 ? containerRect.width : 320;

    lastPositions.forEach((lastPos, id) => {
      const firstPos = firstPositions.get(id);

      // Se il box non esisteva prima, è nuovo (skip animation, gestito separatamente)
      if (!firstPos) return;

      // Posizione FIRST in pixel assoluti
      const firstLeft =
        containerRect.left + firstPos.columnIndex * (BOX_WIDTH + gap);
      const firstTop = containerRect.top + firstPos.top;

      // Posizione LAST in pixel assoluti
      const lastLeft =
        containerRect.left + lastPos.columnIndex * (BOX_WIDTH + gap);
      const lastTop = containerRect.top + lastPos.top;

      // INVERT: calcola quanto dobbiamo spostare indietro per simulare la posizione vecchia
      const deltaX = firstLeft - lastLeft;
      const deltaY = firstTop - lastTop;

      // Soglia per considerare il movimento significativo (evita micro-movimenti)
      const MOVEMENT_THRESHOLD = 2;

      if (
        Math.abs(deltaX) >= MOVEMENT_THRESHOLD ||
        Math.abs(deltaY) >= MOVEMENT_THRESHOLD
      ) {
        boxesToAnimate.set(id, { deltaX, deltaY });
      }
    });

    // FASE 2: Applica le animazioni FLIP solo ai box che si muovono
    const elements = containerRef.current.querySelectorAll("[data-bento-id]");

    // Prima gestiamo i nuovi elementi (devono apparire immediatamente nella posizione corretta)
    const newElementsToShow = [];
    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      if (newItemIds.has(id)) {
        newElementsToShow.push({ el, id });
      }
    });

    // Poi gestiamo le animazioni dei box esistenti
    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");

      // Skip nuovi elementi (gestiti separatamente)
      if (newItemIds.has(id)) {
        return;
      }

      // Controlla se questo box deve essere animato
      const animationData = boxesToAnimate.get(id);

      if (!animationData) {
        // Box NON si muove: assicurati che non abbia transform residui
        if (el.style.transform) {
          el.style.transition = "none";
          el.style.transform = "";
        }
        return;
      }

      // Box SI MUOVE: applica animazione FLIP
      const { deltaX, deltaY } = animationData;

      // Cancella eventuali animazioni in corso
      if (animatingRef.current.has(id)) {
        el.style.transition = "none";
        el.style.transform = "";
      }

      animatingRef.current.add(id);

      // INVERT: applica trasformazione inversa (istantanea) per riportare visivamente alla posizione vecchia
      el.style.transition = "none";
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Force reflow per assicurare che il transform venga applicato
      el.offsetHeight;

      // PLAY: anima verso la posizione finale (transform = 0)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Animazione fluida: 500ms con easing Material Design "emphasized"
          // cubic-bezier(0.2, 0, 0, 1) = emphasize deceleration
          el.style.transition = "transform 500ms cubic-bezier(0.2, 0, 0, 1)";
          el.style.transform = "translate(0, 0)";

          const cleanup = () => {
            el.style.transform = "";
            el.style.transition = "";
            animatingRef.current.delete(id);
          };

          el.addEventListener("transitionend", cleanup, { once: true });
          setTimeout(cleanup, 550); // Cleanup di sicurezza
        });
      });
    });

    // FASE 3: Mostra i nuovi elementi nella posizione corretta (dopo il layout)
    // Aspettiamo che il DOM sia stabile, poi facciamo apparire i nuovi box
    if (newElementsToShow.length > 0) {
      // Rimuovi gli ID da newItemIds spostandoli in fadingInIds
      // Questo rende i box visibility: visible ma ancora opacity: 0
      setFadingInIds((prev) => {
        const next = new Set(prev);
        newElementsToShow.forEach(({ id }) => next.add(id));
        return next;
      });

      // Aspetta che il DOM si sia stabilizzato e che visibility: visible sia applicato
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Ulteriore frame per assicurarsi che tutto sia stabile
          requestAnimationFrame(() => {
            newElementsToShow.forEach(({ el, id }) => {
              // Ora il box è nella posizione corretta e visibility: visible
              // Fade-in con opacity
              el.style.transition = "opacity 250ms ease-out";
              el.style.opacity = "1";

              const cleanup = () => {
                el.style.transition = "";
                el.style.opacity = "";
                // Rimuovi dal set di fade-in
                setFadingInIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
              };

              el.addEventListener("transitionend", cleanup, { once: true });
              setTimeout(cleanup, 300); // Cleanup di sicurezza
            });
          });
        });
      });
    }

    // FASE 4: Salva le posizioni target correnti per il prossimo ciclo
    // Queste diventeranno le posizioni "FIRST" nella prossima animazione
    targetPositionsRef.current = lastPositions;
    isReadyToAnimateRef.current = false;
  }, [
    columns,
    columnCount,
    calculateTargetPositions,
    itemsKey,
    newItemIds,
    gap,
  ]);

  // Funzione helper per ottenere lo stile iniziale di un elemento
  // I nuovi elementi devono essere completamente nascosti finché non sono nella posizione corretta
  const getItemStyle = useCallback(
    (itemId) => {
      // Nascondi completamente se è un nuovo elemento (non ancora posizionato)
      if (newItemIds.has(itemId)) {
        return { opacity: 0, visibility: "hidden" };
      }
      // Nascondi con opacity se sta facendo il fade-in (già posizionato)
      if (fadingInIds.has(itemId)) {
        return { opacity: 0, visibility: "visible" };
      }
      return {};
    },
    [newItemIds, fadingInIds],
  );

  // Crea un array flat di tutti gli items con la loro colonna assegnata
  // e le coordinate assolute per il posizionamento
  const flatItems = useMemo(() => {
    const result = [];
    const columnTops = Array(columnCount).fill(0);

    const ESTIMATED_HEIGHTS = {
      tutorial: 200,
      add: 320,
      note: 180,
      photo: 280,
      file: 200,
      generic: 200,
    };
    const DEFAULT_HEIGHT = 200;

    columns.forEach((colItems, colIndex) => {
      colItems.forEach((item) => {
        const top = columnTops[colIndex];

        // Ottieni l'altezza misurata o stimata
        const measuredHeight = heights.get(item.id);
        const estimatedHeight =
          ESTIMATED_HEIGHTS[item.type] ||
          ESTIMATED_HEIGHTS[item.boxType] ||
          DEFAULT_HEIGHT;
        const itemHeight = measuredHeight || estimatedHeight;

        result.push({
          ...item,
          columnIndex: colIndex,
          top: top,
        });

        // Aggiorna l'altezza cumulativa per questa colonna
        columnTops[colIndex] = top + itemHeight + gap;
      });
    });

    return result;
  }, [columns, columnCount, heights, gap]);

  // Calcola l'altezza totale del container (altezza della colonna più alta)
  const containerHeight = useMemo(() => {
    const columnTops = Array(columnCount).fill(0);

    const ESTIMATED_HEIGHTS = {
      tutorial: 200,
      add: 320,
      note: 180,
      photo: 280,
      file: 200,
      generic: 200,
    };
    const DEFAULT_HEIGHT = 200;

    columns.forEach((colItems, colIndex) => {
      colItems.forEach((item) => {
        const measuredHeight = heights.get(item.id);
        const estimatedHeight =
          ESTIMATED_HEIGHTS[item.type] ||
          ESTIMATED_HEIGHTS[item.boxType] ||
          DEFAULT_HEIGHT;
        const itemHeight = measuredHeight || estimatedHeight;
        columnTops[colIndex] += itemHeight + gap;
      });
    });

    return Math.max(...columnTops, 0);
  }, [columns, columnCount, heights, gap]);

  return { containerRef, columns, getItemStyle, flatItems, containerHeight };
};

export default useBentoAnimation;
