import { useRef, useLayoutEffect, useCallback, useEffect } from "react";

/**
 * Hook per animare elementi che cambiano posizione nella griglia
 * Usa la tecnica FLIP (First, Last, Invert, Play)
 * L'animazione parte sempre dalla posizione corrente degli elementi
 *
 * @param {Array} items - Array di elementi con id univoci
 * @param {number} columnCount - Numero di colonne (trigger per ricalcolo)
 * @returns {Object} - { containerRef }
 */
const useBentoAnimation = (items, columnCount) => {
  const containerRef = useRef(null);
  const positionsRef = useRef(new Map());
  const isFirstRenderRef = useRef(true);
  const animatingRef = useRef(new Set());

  // Salva le posizioni correnti PRIMA che React faccia il re-render
  const capturePositions = useCallback(() => {
    if (!containerRef.current) return;

    const newPositions = new Map();
    const elements = containerRef.current.querySelectorAll("[data-bento-id]");

    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      const rect = el.getBoundingClientRect();

      // Se l'elemento sta animando, calcola la posizione reale
      // considerando la trasformazione corrente
      const computedStyle = window.getComputedStyle(el);
      const transform = computedStyle.transform;

      let offsetX = 0;
      let offsetY = 0;

      if (transform && transform !== "none") {
        const matrix = new DOMMatrix(transform);
        offsetX = matrix.m41;
        offsetY = matrix.m42;
      }

      newPositions.set(id, {
        left: rect.left - offsetX,
        top: rect.top - offsetY,
        width: rect.width,
        height: rect.height,
      });
    });

    positionsRef.current = newPositions;
  }, []);

  // Cattura posizioni prima di ogni cambio di layout
  useEffect(() => {
    capturePositions();
  }, [items, columnCount, capturePositions]);

  // Anima dopo il re-render
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Skip animazione al primo render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const elements = containerRef.current.querySelectorAll("[data-bento-id]");

    elements.forEach((el) => {
      const id = el.getAttribute("data-bento-id");
      const oldPos = positionsRef.current.get(id);

      // Cancella eventuali animazioni in corso
      if (animatingRef.current.has(id)) {
        el.style.transition = "none";
        el.style.transform = "";
      }

      if (!oldPos) {
        // Nuovo elemento - animazione di entrata
        el.style.opacity = "0";
        el.style.transform = "scale(0.8) translateY(20px)";

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition =
              "opacity 300ms ease-out, transform 300ms ease-out";
            el.style.opacity = "1";
            el.style.transform = "scale(1) translateY(0)";

            const cleanup = () => {
              el.style.transform = "";
              el.style.transition = "";
              el.style.opacity = "";
            };
            el.addEventListener("transitionend", cleanup, { once: true });
            setTimeout(cleanup, 350);
          });
        });
        return;
      }

      const newRect = el.getBoundingClientRect();
      const deltaX = oldPos.left - newRect.left;
      const deltaY = oldPos.top - newRect.top;

      // Se non c'è movimento significativo, skip
      if (Math.abs(deltaX) < 2 && Math.abs(deltaY) < 2) return;

      animatingRef.current.add(id);

      // FLIP: Applica trasformazione inversa (posizione precedente)
      el.style.transition = "none";
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      // Force reflow per applicare immediatamente
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
          // Fallback
          setTimeout(cleanup, 400);
        });
      });
    });
  }, [items, columnCount]);

  return { containerRef };
};

export default useBentoAnimation;
