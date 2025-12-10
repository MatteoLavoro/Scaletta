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
 * @param {Array} items - Array di elementi con id univoci
 * @param {number} columnCount - Numero di colonne
 * @param {number} gap - Gap tra i box (default: 16)
 * @returns {Object} - { containerRef, columns, getItemStyle }
 */
const useBentoAnimation = (items, columnCount, gap = 16) => {
  const containerRef = useRef(null);
  const positionsRef = useRef(new Map());
  const heightsRef = useRef(new Map());
  const isFirstRenderRef = useRef(true);
  const animatingRef = useRef(new Set());
  const resizeObserverRef = useRef(null);
  const [heights, setHeights] = useState(new Map());
  
  // Ref per tracciare gli ID conosciuti (sincronamente)
  const knownIdsRef = useRef(new Set());
  // Set di ID degli elementi che devono fare fade-in (nascosti inizialmente)
  const [newItemIds, setNewItemIds] = useState(() => new Set());
  // Set di ID che stanno facendo fade-in (per gestire animazione)
  const fadingInRef = useRef(new Set());
  
  // Identifica i nuovi elementi PRIMA del render confrontando con gli ID conosciuti
  // Questo è sincrono e avviene durante il render, così getItemStyle può nasconderli subito
  const currentIds = useMemo(() => new Set(items.map(item => item.id)), [items]);
  
  // Trova i nuovi ID (quelli presenti ora ma non conosciuti prima)
  const newlyAddedIds = useMemo(() => {
    const newIds = new Set();
    currentIds.forEach(id => {
      if (!knownIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });
    return newIds;
  }, [currentIds]);
  
  // Pulisci gli ID non più presenti dal knownIdsRef
  useEffect(() => {
    // Rimuovi da knownIds gli elementi che non esistono più
    knownIdsRef.current.forEach(id => {
      if (!currentIds.has(id)) {
        knownIdsRef.current.delete(id);
      }
    });
  }, [currentIds]);

  // Crea una chiave unica basata sugli items per rilevare cambiamenti nel contenuto
  const itemsKey = useMemo(() => {
    return items
      .map((item) => `${item.id}:${item.content || ""}:${item.title || ""}`)
      .join("|");
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

  // Cattura le posizioni correnti degli elementi
  const capturePositions = useCallback(() => {
    if (!containerRef.current) return new Map();

    const positions = new Map();
    const elements = containerRef.current.querySelectorAll("[data-bento-id]");

    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      const rect = el.getBoundingClientRect();

      // Se l'elemento sta animando, calcola la posizione reale
      const computedStyle = window.getComputedStyle(el);
      const transform = computedStyle.transform;

      let offsetX = 0;
      let offsetY = 0;

      if (transform && transform !== "none") {
        const matrix = new DOMMatrix(transform);
        offsetX = matrix.m41;
        offsetY = matrix.m42;
      }

      positions.set(id, {
        left: rect.left - offsetX,
        top: rect.top - offsetY,
        width: rect.width,
        height: rect.height,
      });
    });

    return positions;
  }, []);

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

  // useLayoutEffect per animazioni FLIP
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Skip animazione al primo render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      containerRef.current.offsetHeight;
      positionsRef.current = capturePositions();
      // Segna tutti gli items iniziali come conosciuti
      items.forEach(item => knownIdsRef.current.add(item.id));
      return;
    }

    // Usa le posizioni salvate dal ciclo precedente
    const oldPositions = positionsRef.current;

    // Forza reflow
    containerRef.current.offsetHeight;

    // Calcola le nuove posizioni
    const newPositions = capturePositions();

    // Salva per il prossimo ciclo
    positionsRef.current = newPositions;

    const elements = containerRef.current.querySelectorAll("[data-bento-id]");

    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      const oldPos = oldPositions.get(id);
      const newPos = newPositions.get(id);

      // Cancella eventuali animazioni in corso
      if (animatingRef.current.has(id)) {
        el.style.transition = "none";
        el.style.transform = "";
      }

      // Nuovo elemento - era già nascosto da getItemStyle, ora fai fade-in
      if (newlyAddedIds.has(id) && !fadingInRef.current.has(id)) {
        fadingInRef.current.add(id);
        // Aggiungi agli ID conosciuti
        knownIdsRef.current.add(id);

        // Fade-in dalla posizione corretta (già nella griglia, nascosto con opacity:0)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = "opacity 250ms ease-out";
            el.style.opacity = "1";

            const cleanup = () => {
              el.style.transition = "";
              el.style.opacity = "";
              fadingInRef.current.delete(id);
              // Rimuovi dall'elenco dei nuovi dopo l'animazione
              setNewItemIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            };
            el.addEventListener("transitionend", cleanup, { once: true });
            setTimeout(cleanup, 300);
          });
        });
        return;
      }

      if (!oldPos || !newPos) return;

      const deltaX = oldPos.left - newPos.left;
      const deltaY = oldPos.top - newPos.top;

      // Se non c'è movimento significativo, skip
      if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) return;

      animatingRef.current.add(id);

      // FLIP: Applica trasformazione inversa
      el.style.transition = "none";
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      el.offsetHeight;

      // Play: Anima verso la posizione finale
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = "transform 350ms cubic-bezier(0.4, 0, 0.2, 1)";
          el.style.transform = "translate(0, 0)";

          const cleanup = () => {
            el.style.transform = "";
            el.style.transition = "";
            animatingRef.current.delete(id);
          };

          el.addEventListener("transitionend", cleanup, { once: true });
          setTimeout(cleanup, 400);
        });
      });
    });

    // Sincronizza newItemIds con i nuovi elementi identificati
    if (newlyAddedIds.size > 0) {
      setNewItemIds(newlyAddedIds);
    }
  }, [columns, columnCount, capturePositions, itemsKey, newlyAddedIds]);

  // Funzione helper per ottenere lo stile iniziale di un elemento
  // I nuovi elementi devono essere nascosti finché non sono nella posizione corretta
  const getItemStyle = useCallback(
    (itemId) => {
      // Nascondi se è un nuovo elemento appena aggiunto (identificato sincronamente)
      // oppure se è nell'elenco degli elementi che stanno facendo fade-in
      if (newlyAddedIds.has(itemId) || newItemIds.has(itemId)) {
        return { opacity: 0 };
      }
      return {};
    },
    [newlyAddedIds, newItemIds]
  );

  return { containerRef, columns, getItemStyle };
};

export default useBentoAnimation;
